import { action } from './_generated/server'
import type { ActionCtx } from './_generated/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'
import {
  GoogleGenerativeAI,
  SchemaType,
  FunctionCallingMode,
  type Content,
  type FunctionDeclaration,
  type FunctionCall
} from '@google/generative-ai'
import {
  isVoyageEmbeddingsEnabled,
  voyageEmbedSingle
} from './lib/voyageClient'

const MAX_TOOL_ROUNDS = 8

const SYSTEM_INSTRUCTION = `You are an assistant for a recruiting / careers workspace app.
The user has jobs, job templates (with matching rules), custom pages, and folders.
Always use the provided tools to read real data from the database. Never invent job or template IDs.
If a tool returns an empty list, say so clearly.
For fuzzy or conceptual questions, use semantic_search to find relevant items before answering.
Reply concisely in plain language.`

function toolDeclarations (): FunctionDeclaration[] {
  const stringArray = {
    type: SchemaType.ARRAY,
    items: { type: SchemaType.STRING }
  } as const

  return [
    {
      name: 'get_workspace_stats',
      description:
        'High-level counts and small samples (locations, industries, template titles). Call first to orient.'
    },
    {
      name: 'search_jobs',
      description:
        'Search jobs by substring over title/company/location/industry, with optional facet filters.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          search: { type: SchemaType.STRING, nullable: true },
          locations: { ...stringArray, nullable: true },
          industries: { ...stringArray, nullable: true },
          companies: { ...stringArray, nullable: true },
          templateTitles: { ...stringArray, nullable: true },
          status: {
            type: SchemaType.STRING,
            format: 'enum' as const,
            enum: ['active', 'inactive'],
            nullable: true
          },
          limit: { type: SchemaType.NUMBER, nullable: true }
        }
      }
    },
    {
      name: 'get_job',
      description: 'Get one job by external id (e.g. job-1) including assigned template title.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          externalId: { type: SchemaType.STRING }
        },
        required: ['externalId']
      }
    },
    {
      name: 'search_templates',
      description: 'Search job templates by title and condition text.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          search: { type: SchemaType.STRING, nullable: true },
          limit: { type: SchemaType.NUMBER, nullable: true }
        }
      }
    },
    {
      name: 'get_template',
      description: 'Get one job template by external id with full condition fields.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          externalId: { type: SchemaType.STRING }
        },
        required: ['externalId']
      }
    },
    {
      name: 'search_custom_pages',
      description: 'Search custom pages by title substring.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          search: { type: SchemaType.STRING, nullable: true },
          limit: { type: SchemaType.NUMBER, nullable: true }
        }
      }
    },
    {
      name: 'search_custom_folders',
      description: 'Search custom folders by title substring.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          search: { type: SchemaType.STRING, nullable: true },
          limit: { type: SchemaType.NUMBER, nullable: true }
        }
      }
    },
    {
      name: 'semantic_search',
      description:
        'Vector similarity search over embedded workspace content (jobs, templates, pages, folders). Use for vague or conceptual queries.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          query: { type: SchemaType.STRING },
          namespaces: { ...stringArray, nullable: true },
          limit: { type: SchemaType.NUMBER, nullable: true }
        },
        required: ['query']
      }
    }
  ]
}

function toGeminiContents (
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Content[] {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }))
}

type ToolCtx = Pick<ActionCtx, 'runQuery' | 'vectorSearch'>

async function dispatchTool (
  ctx: ToolCtx,
  name: string,
  rawArgs: object
): Promise<object> {
  const args = rawArgs as Record<string, unknown>

  switch (name) {
    case 'get_workspace_stats':
      return await ctx.runQuery(internal.agentTools.getWorkspaceStats, {})
    case 'search_jobs':
      return await ctx.runQuery(internal.agentTools.searchJobs, {
        search: (args.search as string) ?? undefined,
        locations: args.locations as string[] | undefined,
        industries: args.industries as string[] | undefined,
        companies: args.companies as string[] | undefined,
        templateTitles: args.templateTitles as string[] | undefined,
        status: args.status as 'active' | 'inactive' | undefined,
        limit: args.limit as number | undefined
      })
    case 'get_job':
      return (
        (await ctx.runQuery(internal.agentTools.getJobByExternalId, {
          externalId: String(args.externalId ?? '')
        })) ?? { notFound: true }
      )
    case 'search_templates':
      return await ctx.runQuery(internal.agentTools.searchTemplates, {
        search: (args.search as string) ?? undefined,
        limit: args.limit as number | undefined
      })
    case 'get_template':
      return (
        (await ctx.runQuery(internal.agentTools.getTemplateByExternalId, {
          externalId: String(args.externalId ?? '')
        })) ?? { notFound: true }
      )
    case 'search_custom_pages':
      return await ctx.runQuery(internal.agentTools.searchCustomPages, {
        search: (args.search as string) ?? undefined,
        limit: args.limit as number | undefined
      })
    case 'search_custom_folders':
      return await ctx.runQuery(internal.agentTools.searchCustomFolders, {
        search: (args.search as string) ?? undefined,
        limit: args.limit as number | undefined
      })
    case 'semantic_search': {
      if (!isVoyageEmbeddingsEnabled()) {
        return {
          hits: [],
          voyageDisabled: true,
          message:
            'Vector / Voyage search is off (set VOYAGE_DISABLED unset in Convex to enable).'
        }
      }
      const query = String(args.query ?? '')
      const lim = Math.min(
        24,
        Math.max(1, Math.floor(Number(args.limit ?? 12) || 12))
      )
      const rawNs = args.namespaces as string[] | undefined
      const allowed = new Set([
        'job',
        'jobTemplate',
        'customPage',
        'customFolder'
      ])
      const namespaces = (rawNs ?? []).filter((n) => allowed.has(n)) as Array<
        'job' | 'jobTemplate' | 'customPage' | 'customFolder'
      >

      const vector = await voyageEmbedSingle(query, 'query')
      if (vector === null) {
        return { hits: [], voyageDisabled: true }
      }
      const baseOpts = { vector, limit: lim }
      const hits =
        namespaces.length === 1
          ? await ctx.vectorSearch('contentEmbeddings', 'by_embedding', {
              ...baseOpts,
              filter: (q) => q.eq('namespace', namespaces[0])
            })
          : namespaces.length > 1
            ? await ctx.vectorSearch('contentEmbeddings', 'by_embedding', {
                ...baseOpts,
                filter: (q) =>
                  q.or(
                    ...namespaces.map((n) => q.eq('namespace', n))
                  )
              })
            : await ctx.vectorSearch('contentEmbeddings', 'by_embedding', baseOpts)

      const ids = hits.map((h) => h._id)
      const rows = await ctx.runQuery(internal.agentTools.getContentEmbeddingsByIds, {
        ids
      })

      const merged = hits.map((h, i) => ({
        score: h._score,
        ...(rows[i] ?? { missing: true })
      }))
      return { hits: merged }
    }
    default:
      return { error: `Unknown tool: ${name}` }
  }
}

async function runGeminiToolLoop (
  ctx: ToolCtx,
  apiKey: string,
  modelName: string,
  contents: Content[]
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const tools = toolDeclarations()
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_INSTRUCTION
  })

  let rounds = 0
  while (rounds < MAX_TOOL_ROUNDS) {
    rounds++
    const result = await model.generateContent({
      contents,
      tools: [{ functionDeclarations: tools }],
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingMode.AUTO
        }
      }
    })
    const response = result.response
    const calls = response.functionCalls() as FunctionCall[] | undefined

    if (calls == null || calls.length === 0) {
      try {
        return response.text()
      } catch {
        return 'The model did not return readable text (it may have been blocked).'
      }
    }

    const candidate = response.candidates?.[0]?.content
    if (candidate != null) {
      contents.push(candidate)
    }

    for (const call of calls) {
      const out = await dispatchTool(ctx, call.name, call.args)
      contents.push({
        role: 'function',
        parts: [
          {
            functionResponse: {
              name: call.name,
              response: { result: out }
            }
          }
        ]
      })
    }
  }

  return 'Stopped after maximum tool rounds; try a narrower question.'
}

export const agentChat = action({
  args: {
    messages: v.array(
      v.object({
        role: v.union(v.literal('user'), v.literal('assistant')),
        content: v.string()
      })
    )
  },
  handler: async (ctx, { messages }) => {
    const apiKey = process.env.GEMINI_API_KEY
    if (apiKey == null || apiKey === '') {
      throw new Error('GEMINI_API_KEY is not set in Convex environment')
    }

    if (messages.length === 0) {
      return { reply: 'Send at least one message.' }
    }

    const contents = toGeminiContents(messages)

    const primary =
      process.env.GEMINI_MODEL != null && process.env.GEMINI_MODEL !== ''
        ? process.env.GEMINI_MODEL
        : 'gemini-2.5-flash'

    try {
      const reply = await runGeminiToolLoop(ctx, apiKey, primary, contents)
      return { reply }
    } catch (firstErr) {
      if (primary === 'gemini-2.0-flash') {
        throw firstErr
      }
      try {
        const contentsFallback = toGeminiContents(messages)
        const reply = await runGeminiToolLoop(
          ctx,
          apiKey,
          'gemini-2.0-flash',
          contentsFallback
        )
        return { reply }
      } catch {
        throw firstErr
      }
    }
  }
})
