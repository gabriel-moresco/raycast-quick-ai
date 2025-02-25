import {
  Form,
  ActionPanel,
  Action,
  closeMainWindow,
  LaunchProps,
  Icon,
  Cache,
  PopToRootType,
} from '@raycast/api'
import { useForm } from '@raycast/utils'
import { exec } from 'child_process'

const PROVIDER_CACHE_KEY = '@open-ai-chat:provider'
const MODEL_CACHE_KEY = '@open-ai-chat:model'
const SEARCH_CACHE_KEY = '@open-ai-chat:search'

const providers = ['ChatGPT', 'Claude'] as const
type Provider = (typeof providers)[number]

type ModelKey = 'o3-mini' | 'gpt-4o' | 'claude-3.7-sonnet'

type Model = {
  key: ModelKey
  provider: Provider
}

const models: Model[] = [
  {
    key: 'o3-mini',
    provider: 'ChatGPT',
  },
  {
    key: 'gpt-4o',
    provider: 'ChatGPT',
  },
  {
    key: 'claude-3.7-sonnet',
    provider: 'Claude',
  },
]

type Schema = {
  prompt: string
  provider: Provider
  model: ModelKey
  search: boolean
}

const cache = new Cache()

export default function Command({ draftValues }: LaunchProps<{ draftValues: Schema }>) {
  const onSubmit = async (values: Schema) => {
    const { prompt, provider, model, search } = values

    let url: URL

    switch (provider) {
      case 'ChatGPT': {
        url = new URL('https://chatgpt.com')
        url.searchParams.set('q', prompt)

        let hints: string | null = null

        if (model === 'o3-mini') {
          hints = hints ? `${hints},reason` : 'reason'
        }

        if (model === 'gpt-4o' && search) {
          hints = hints ? `${hints},search` : 'search'
        }

        if (hints) {
          url.searchParams.set('hints', hints)
        }

        break
      }
      case 'Claude': {
        url = new URL('https://claude.ai/new')
        url.searchParams.set('q', prompt)

        break
      }
    }

    closeMainWindow({ popToRootType: PopToRootType.Immediate })

    exec(`open "${url.toString()}"`)
  }

  const defaultPrompt: string = draftValues ? draftValues.prompt : ''
  const defaultProvider: Provider = draftValues
    ? draftValues.provider
    : cache.has(PROVIDER_CACHE_KEY)
      ? (cache.get(PROVIDER_CACHE_KEY) as Provider)
      : 'ChatGPT'
  const defaultModel: ModelKey = draftValues
    ? draftValues.model
    : cache.has(MODEL_CACHE_KEY)
      ? (cache.get(MODEL_CACHE_KEY) as ModelKey)
      : 'o3-mini'
  const defaultSearch: boolean = draftValues
    ? draftValues.search
    : cache.has(SEARCH_CACHE_KEY)
      ? cache.get(SEARCH_CACHE_KEY) === 'true'
      : false

  const { handleSubmit, itemProps } = useForm<Schema>({
    onSubmit,
    validation: {
      prompt: (value: string | undefined) => {
        if (!value || value.length === 0) {
          return 'Prompt is required.'
        }
      },
    },
    initialValues: {
      prompt: defaultPrompt,
      provider: defaultProvider,
      model: defaultModel,
      search: defaultSearch,
    },
  })

  return (
    <Form
      enableDrafts
      actions={
        <ActionPanel title='Quick AI'>
          <Action.SubmitForm title='Open AI Chat' onSubmit={handleSubmit} icon={Icon.Stars} />
        </ActionPanel>
      }
    >
      <Form.TextArea
        title='Prompt'
        placeholder='What can I help with?'
        autoFocus
        enableMarkdown
        {...itemProps.prompt}
      />

      <Form.Dropdown
        title='Provider'
        {...itemProps.provider}
        onChange={newValue => {
          itemProps.provider.onChange?.(newValue as Provider)
          cache.set(PROVIDER_CACHE_KEY, newValue)
        }}
        onFocus={event => {
          // @ts-expect-error prevent enum error
          itemProps.model.onFocus?.(event)
        }}
        onBlur={event => {
          // @ts-expect-error prevent enum error
          itemProps.model.onBlur?.(event)
        }}
      >
        {providers.map((provider, index) => (
          <Form.Dropdown.Item key={index} value={provider} title={provider} />
        ))}
      </Form.Dropdown>

      <Form.Dropdown
        title='Model'
        {...itemProps.model}
        onChange={newValue => {
          itemProps.model.onChange?.(newValue as ModelKey)
          cache.set(MODEL_CACHE_KEY, newValue)
        }}
        onFocus={event => {
          // @ts-expect-error prevent enum error
          itemProps.model.onFocus?.(event)
        }}
        onBlur={event => {
          // @ts-expect-error prevent enum error
          itemProps.model.onBlur?.(event)
        }}
      >
        {models
          .filter(model => model.provider === itemProps.provider.value)
          .map((model, index) => (
            <Form.Dropdown.Item key={index} value={model.key} title={model.key} />
          ))}
      </Form.Dropdown>

      {itemProps.provider.value === 'ChatGPT' && itemProps.model.value === 'o3-mini' && (
        <Form.Checkbox
          id='reason'
          title='Reason'
          label='Think before responding'
          value={true}
          // This is a read-only checkbox
          onChange={() => {}}
        />
      )}

      {itemProps.provider.value === 'ChatGPT' && itemProps.model.value === 'gpt-4o' && (
        <Form.Checkbox
          title='Search'
          label='Search the web'
          {...itemProps.search}
          onChange={newValue => {
            itemProps.search.onChange?.(newValue)
            cache.set(SEARCH_CACHE_KEY, newValue.toString())
          }}
        />
      )}
    </Form>
  )
}
