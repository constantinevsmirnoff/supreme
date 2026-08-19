<script setup lang="ts">
/**
 * Template thumbnail drop zone — Figma UI Kit node 141:1451
 * States: default, drag-over, uploading (XHR progress), uploaded (preview + ConditionValue).
 */
import { ref, computed } from 'vue'
import ConditionValue from '@/components/ui/ConditionValue.vue'
import {
  uploadTemplateThumbnail,
  clearTemplateThumbnail
} from '@/src/state/jobsAndTemplatesStore.js'

const MAX_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png'])

const props = withDefaults(
  defineProps<{
    templateId: string
    imageUrl: string
    fileName?: string
    disabled?: boolean
  }>(),
  { fileName: '', disabled: false }
)

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)
const dragLabel = ref('')
const uploading = ref(false)
const uploadPercent = ref(0)
const uploadingFileName = ref('')
const errorMsg = ref('')

const hasImage = computed(
  () => Boolean(props.imageUrl && props.imageUrl.length > 0)
)

const displayFileName = computed(() =>
  props.fileName && props.fileName.length > 0 ? props.fileName : 'Image'
)

const showUploadedRow = computed(
  () => hasImage.value && !uploading.value
)

function validateImageFile (file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return 'Use a JPG or PNG file.'
  }
  if (file.size > MAX_BYTES) {
    return 'File must be 2 MB or smaller.'
  }
  return null
}

function clearError () {
  errorMsg.value = ''
}

function openFilePicker () {
  if (props.disabled) return
  clearError()
  fileInputRef.value?.click()
}

async function runUpload (file: File) {
  const err = validateImageFile(file)
  if (err) {
    errorMsg.value = err
    return
  }
  clearError()
  uploading.value = true
  uploadPercent.value = 0
  uploadingFileName.value = file.name
  try {
    await uploadTemplateThumbnail(props.templateId, file, (p) => {
      uploadPercent.value = p
    })
  } catch (e) {
    errorMsg.value =
      e instanceof Error ? e.message : 'Upload failed. Try again.'
  } finally {
    uploading.value = false
  }
}

function onInputChange (e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  void runUpload(file)
}

function peekDragFileName (dt: DataTransfer | null): string {
  if (!dt) return ''
  const f = dt.files?.[0]
  if (f?.name) return f.name
  const item = dt.items?.[0]
  if (item?.kind === 'file') {
    const file = item.getAsFile()
    if (file?.name) return file.name
  }
  return ''
}

function onDragEnter (e: DragEvent) {
  if (props.disabled || uploading.value || showUploadedRow.value) return
  e.preventDefault()
  if (!e.dataTransfer?.types?.includes('Files')) return
  isDragOver.value = true
  dragLabel.value = peekDragFileName(e.dataTransfer)
}

function onDragOver (e: DragEvent) {
  if (props.disabled || uploading.value || showUploadedRow.value) return
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy'
    const name = peekDragFileName(e.dataTransfer)
    if (name) dragLabel.value = name
  }
}

function onDragLeave (e: DragEvent) {
  if (props.disabled || uploading.value || showUploadedRow.value) return
  const cur = e.currentTarget
  if (!(cur instanceof HTMLElement)) return
  const rel = e.relatedTarget
  if (rel instanceof Node && cur.contains(rel)) return
  isDragOver.value = false
  dragLabel.value = ''
}

function onDrop (e: DragEvent) {
  if (props.disabled || uploading.value || showUploadedRow.value) return
  e.preventDefault()
  isDragOver.value = false
  dragLabel.value = ''
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  void runUpload(file)
}

async function onRemove () {
  if (props.disabled) return
  clearError()
  await clearTemplateThumbnail(props.templateId)
}
</script>

<template>
  <div class="thumbnail-uploader">
    <div class="thumbnail-uploader__label-row">
      <p class="thumbnail-uploader__label">
        Thumbnail
      </p>
    </div>

    <div
      class="thumbnail-uploader__zone"
      :class="{
        'thumbnail-uploader__zone--drag': isDragOver && !showUploadedRow,
        'thumbnail-uploader__zone--compact': showUploadedRow
      }"
      @dragenter="onDragEnter"
      @dragleave="onDragLeave"
      @dragover="onDragOver"
      @drop="onDrop"
    >
      <div
        v-if="showUploadedRow"
        class="thumbnail-uploader__uploaded-row"
      >
        <img
          class="thumbnail-uploader__thumb"
          :src="imageUrl"
          :alt="displayFileName"
        >
        <ConditionValue
          variant="bare"
          :label="displayFileName"
          @remove="onRemove"
        />
      </div>

      <div
        v-else-if="uploading"
        class="thumbnail-uploader__uploading"
      >
        <p class="thumbnail-uploader__uploading-line">
          Uploading "{{ uploadingFileName }}"
        </p>
        <div class="thumbnail-uploader__progress-row">
          <div
            class="thumbnail-uploader__track"
            role="progressbar"
            :aria-valuenow="uploadPercent"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Upload progress"
          >
            <div
              class="thumbnail-uploader__fill"
              :style="{ width: `${uploadPercent}%` }"
            />
          </div>
          <span class="thumbnail-uploader__pct">{{ uploadPercent }}%</span>
        </div>
      </div>

      <div
        v-else
        class="thumbnail-uploader__idle"
      >
        <p class="thumbnail-uploader__hint">
          Drag and drop the image here or
        </p>
        <div
          v-if="isDragOver && dragLabel"
          class="thumbnail-uploader__drag-pill"
          :title="dragLabel"
        >
          <span class="thumbnail-uploader__drag-pill-text">{{ dragLabel }}</span>
        </div>
        <button
          type="button"
          class="thumbnail-uploader__manual"
          :disabled="disabled"
          @click="openFilePicker"
        >
          Click to upload manually
        </button>
      </div>
    </div>

    <p
      v-if="errorMsg"
      class="thumbnail-uploader__error"
      role="alert"
    >
      {{ errorMsg }}
    </p>

    <input
      ref="fileInputRef"
      type="file"
      class="thumbnail-uploader__hidden"
      accept="image/jpeg,image/png"
      tabindex="-1"
      aria-hidden="true"
      @change="onInputChange"
    >
  </div>
</template>

<style scoped>
.thumbnail-uploader {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-sm);
  width: 100%;
  min-width: 0;
  font-family: var(--font-family-base);
}

.thumbnail-uploader__label-row {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.thumbnail-uploader__label {
  margin: 0;
  font-size: var(--typography-body-large-font-size);
  font-weight: var(--typography-body-large-font-weight-strong);
  line-height: var(--typography-body-large-line-height-strong);
  letter-spacing: var(--typography-body-large-letter-spacing-strong);
  color: var(--color-text-secondary);
}

.thumbnail-uploader__zone {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 194px;
  padding: 7px;
  border: var(--border-width-hairline) dashed var(--color-border-strong);
  border-radius: var(--radius-md);
  background-color: var(--color-white);
}

.thumbnail-uploader__zone--drag {
  border-color: var(--color-primary);
  border-style: dashed;
}

.thumbnail-uploader__zone--compact {
  min-height: 0;
  align-items: stretch;
}

.thumbnail-uploader__idle {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4xl);
  width: 100%;
  min-height: 0;
  flex: 1 1 auto;
}

.thumbnail-uploader__hint {
  margin: 0;
  font-size: var(--typography-body-xl-font-size);
  font-weight: var(--typography-body-xl-font-weight-light);
  line-height: var(--typography-body-xl-line-height-light);
  letter-spacing: var(--typography-body-xl-letter-spacing-light);
  color: var(--color-text-tertiary);
  text-align: center;
}

.thumbnail-uploader__drag-pill {
  box-sizing: border-box;
  max-width: 200px;
  padding: var(--space-2xs) var(--space-xl);
  border-radius: var(--space-4xl);
  background-color: var(--color-primary);
}

.thumbnail-uploader__drag-pill-text {
  display: block;
  overflow: hidden;
  font-size: var(--typography-body-xl-font-size);
  font-weight: var(--typography-body-xl-font-weight-light);
  line-height: var(--typography-body-xl-line-height-light);
  letter-spacing: var(--typography-body-xl-letter-spacing-light);
  color: var(--color-white);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thumbnail-uploader__manual {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  margin: 0;
  padding: var(--space-md) var(--space-3xl);
  border: var(--border-width-hairline) solid var(--color-border-light);
  border-radius: var(--radius-xl);
  background-color: var(--color-white);
  box-shadow: var(--shadow-card-hover);
  -webkit-backdrop-filter: blur(var(--blur-backdrop-sm));
  backdrop-filter: blur(var(--blur-backdrop-sm));
  font-family: var(--font-family-base);
  font-size: var(--typography-body-xl-font-size);
  font-weight: var(--typography-body-xl-font-weight-strong);
  line-height: var(--typography-body-xl-line-height-strong);
  letter-spacing: var(--typography-body-xl-letter-spacing-strong);
  color: var(--color-text-secondary);
  cursor: pointer;
}

.thumbnail-uploader__manual:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.thumbnail-uploader__manual:focus {
  outline: none;
}

.thumbnail-uploader__manual:focus-visible {
  box-shadow: 0 0 0 2px var(--color-focus-ring);
}

.thumbnail-uploader__uploading {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-4xl);
  width: 100%;
  padding: var(--space-xs) 0;
}

.thumbnail-uploader__uploading-line {
  margin: 0;
  font-size: var(--typography-body-xl-font-size);
  font-weight: var(--typography-body-xl-font-weight-light);
  line-height: var(--typography-body-xl-line-height-light);
  letter-spacing: var(--typography-body-xl-letter-spacing-light);
  color: var(--color-text-tertiary);
  text-align: center;
}

.thumbnail-uploader__progress-row {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: var(--space-4xl);
  width: 100%;
}

.thumbnail-uploader__track {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  height: 6px;
  overflow: hidden;
  border-radius: var(--radius-xs);
  background-color: var(--color-border-strong);
}

.thumbnail-uploader__fill {
  height: 100%;
  border-radius: var(--radius-xs);
  background-color: var(--color-primary);
  transition: width 0.08s linear;
}

.thumbnail-uploader__pct {
  flex-shrink: 0;
  font-size: var(--typography-body-xl-font-size);
  font-weight: var(--typography-body-xl-font-weight-light);
  line-height: var(--typography-body-xl-line-height-light);
  letter-spacing: var(--typography-body-xl-letter-spacing-light);
  color: var(--color-text-tertiary);
}

.thumbnail-uploader__uploaded-row {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: var(--space-4xl);
  width: 100%;
  min-width: 0;
}

.thumbnail-uploader__thumb {
  display: block;
  flex-shrink: 0;
  width: 100px;
  height: 75px;
  border-radius: var(--radius-xs);
  object-fit: cover;
}

.thumbnail-uploader__error {
  margin: 0;
  font-size: var(--typography-body-font-size);
  font-weight: var(--typography-body-font-weight-light);
  line-height: var(--typography-body-line-height);
  color: var(--color-critical);
}

.thumbnail-uploader__hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
