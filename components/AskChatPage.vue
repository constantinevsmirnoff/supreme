<script setup lang="ts">
/**
 * Ask chat — Figma Ask Chat (205:2386)
 * https://www.figma.com/design/e5qpHSeHPsA5LAF0zfjhAU/UI-Kit?node-id=205-2386
 * Scrollable transcript (650px column) + PromptWindow fixed above bottom edge.
 */
import { ref } from 'vue'
import { getConvexClient, api } from '@/src/lib/convexClient.js'
import PromptWindow from '@/components/ui/PromptWindow.vue'
import PromptQuestion from '@/components/ui/PromptQuestion.vue'
import PromptResponse from '@/components/ui/PromptResponse.vue'

type ChatRole = 'user' | 'assistant'

type ChatMessage = {
  role: ChatRole
  content: string
}

const promptText = ref('')
const messages = ref<ChatMessage[]>([])
const loading = ref(false)
const error = ref('')

async function onSubmit () {
  const text = promptText.value.trim()
  if (!text || loading.value) return
  const client = getConvexClient()
  if (!client) {
    error.value = 'Convex is not configured (missing deployment URL).'
    return
  }
  error.value = ''
  messages.value = [...messages.value, { role: 'user', content: text }]
  promptText.value = ''
  loading.value = true
  try {
    const result = await client.action(api.agentChat.agentChat, {
      messages: messages.value
    })
    const reply = result?.reply ?? ''
    messages.value = [...messages.value, { role: 'assistant', content: reply }]
  } catch (e: unknown) {
    error.value =
      e != null && typeof e === 'object' && 'message' in e
        ? String((e as { message?: unknown }).message)
        : String(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div
    class="ask-chat-page"
    data-name="Ask Chat"
    data-node-id="205:2386"
  >
    <div class="ask-chat-page__scroll">
      <div class="ask-chat-page__job-shop" data-name="JobShop" data-node-id="205:2387">
        <div class="ask-chat-page__chat" data-name="Chat" data-node-id="198:1849">
          <template v-for="(m, i) in messages" :key="i">
            <PromptQuestion v-if="m.role === 'user'" :text="m.content" />
            <PromptResponse v-else :text="m.content" />
          </template>
          <p v-if="loading" class="ask-chat-page__loading" aria-live="polite">
            Thinking…
          </p>
          <p v-if="error" class="ask-chat-page__error" role="alert">
            {{ error }}
          </p>
        </div>
      </div>
    </div>
    <div class="ask-chat-page__composer-anchor" data-node-id="205:2676">
      <div class="ask-chat-page__composer">
        <PromptWindow
          v-model="promptText"
          :disabled="loading"
          focus-on-mount
          placeholder="Ask about jobs, templates, or pages…"
          @submit="onSubmit"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.ask-chat-page {
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  width: 100%;
  background-color: var(--color-background-secondary);
}

.ask-chat-page__scroll {
  box-sizing: border-box;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  background-color: var(--color-white);
  padding-top: var(--space-4xl);
  padding-bottom: calc(
    var(--space-4xl) + var(--space-13xl) + var(--space-12xl) + var(--space-5xl)
  );
  -webkit-overflow-scrolling: touch;
}

.ask-chat-page__job-shop {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 1370px;
  margin: 0 auto;
  padding: 0 var(--space-4xl);
}

.ask-chat-page__chat {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: calc(var(--space-3xl) + var(--space-2xs));
  width: 100%;
  max-width: 650px;
  min-width: 0;
}

.ask-chat-page__composer-anchor {
  position: fixed;
  left: 0;
  right: 0;
  bottom: var(--space-4xl);
  z-index: 100;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: flex-end;
  justify-content: center;
  padding: 0 var(--space-4xl);
  pointer-events: none;
}

.ask-chat-page__composer {
  box-sizing: border-box;
  width: min(650px, calc(100vw - 2 * var(--space-4xl)));
  max-width: 100%;
  pointer-events: auto;
}

.ask-chat-page__composer :deep(.prompt-window) {
  width: 100%;
}

.ask-chat-page__loading {
  margin: 0;
  font-family: var(--font-family-base);
  font-size: var(--typography-body-font-size);
  font-weight: var(--typography-body-font-weight-light);
  line-height: var(--typography-body-line-height);
  color: var(--color-text-secondary);
}

.ask-chat-page__error {
  margin: 0;
  font-family: var(--font-family-base);
  font-size: var(--typography-body-font-size);
  font-weight: var(--typography-body-font-weight-light);
  line-height: var(--typography-body-line-height);
  color: var(--color-alert-muted);
}
</style>
