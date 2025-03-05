import {
  Form,
  ActionPanel,
  Action,
  closeMainWindow,
  LaunchProps,
  Icon,
  Cache,
  PopToRootType,
  Image,
} from '@raycast/api'
import { useForm } from '@raycast/utils'
import { exec } from 'child_process'

const PROVIDER_CACHE_KEY = '@open-ai-chat:provider'
const SEARCH_CACHE_KEY = '@open-ai-chat:search'
const REASON_CACHE_KEY = '@open-ai-chat:reason'

type ProviderKey = 'chatgpt' | 'claude' | 'grok' | 'perplexity'

type Provider = {
  key: ProviderKey
  name: string
  url: string
  icon: string
  hasSearch: boolean
  hasReason: boolean
}

const providers: Provider[] = [
  {
    key: 'chatgpt',
    name: 'ChatGPT',
    url: 'https://chatgpt.com',
    icon: 'chatgpt.png',
    hasSearch: true,
    hasReason: true,
  },
  {
    key: 'claude',
    name: 'Claude',
    url: 'https://claude.ai/new',
    icon: 'claude.png',
    hasSearch: false,
    hasReason: false,
  },
  {
    key: 'grok',
    name: 'Grok',
    url: 'https://grok.com',
    icon: 'grok.png',
    hasSearch: false,
    hasReason: false,
  },
  {
    key: 'perplexity',
    name: 'Perplexity',
    url: 'https://www.perplexity.ai/search',
    icon: 'perplexity.png',
    hasSearch: false,
    hasReason: false,
  },
]

type Schema = {
  prompt: string
  provider: ProviderKey
  search: boolean
  reason: boolean
}

const cache = new Cache()

export default function Command({ draftValues }: LaunchProps<{ draftValues: Schema }>) {
  const onSubmit = async (values: Schema) => {
    const { prompt, provider: providerKey, search, reason } = values

    const provider = providers.find(p => p.key === providerKey)

    if (!provider) {
      return
    }

    const url = new URL(provider.url)
    url.searchParams.set('q', prompt)

    switch (providerKey) {
      case 'chatgpt': {
        let hints: string | null = null

        if (reason) {
          hints = hints ? `${hints},reason` : 'reason'
        }

        if (search) {
          hints = hints ? `${hints},search` : 'search'
        }

        if (hints) {
          url.searchParams.set('hints', hints)
        }

        break
      }
    }

    closeMainWindow({ popToRootType: PopToRootType.Immediate })

    exec(`open "${url.toString()}"`)
  }

  const defaultPrompt: string = draftValues ? draftValues.prompt : ''
  const defaultProvider: ProviderKey = draftValues
    ? draftValues.provider
    : cache.has(PROVIDER_CACHE_KEY)
      ? (cache.get(PROVIDER_CACHE_KEY) as ProviderKey)
      : 'chatgpt'
  const defaultSearch: boolean = draftValues
    ? draftValues.search
    : cache.has(SEARCH_CACHE_KEY)
      ? cache.get(SEARCH_CACHE_KEY) === 'true'
      : false
  const defaultReason: boolean = draftValues
    ? draftValues.reason
    : cache.has(REASON_CACHE_KEY)
      ? cache.get(REASON_CACHE_KEY) === 'true'
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
      search: defaultSearch,
      reason: defaultReason,
    },
  })

  const changeProvider = (provider: string) => {
    itemProps.provider.onChange?.(provider as ProviderKey)
    cache.set(PROVIDER_CACHE_KEY, provider)
  }

  const toggleProvider = (direction: 'up' | 'down') => {
    const currentProvider = providers.find(provider => provider.key === itemProps.provider.value)!

    let nextIndex = providers.indexOf(currentProvider) + (direction === 'up' ? -1 : 1)

    if (nextIndex < 0) {
      nextIndex = providers.length - 1
    }

    if (nextIndex >= providers.length) {
      nextIndex = 0
    }

    const nextProvider = providers[nextIndex]

    changeProvider(nextProvider.key)
  }

  return (
    <Form
      enableDrafts
      actions={
        <ActionPanel title='Quick AI'>
          <Action.SubmitForm title='Open AI Chat' onSubmit={handleSubmit} icon={Icon.Stars} />
          <Action
            title='Toggle Provider'
            onAction={() => toggleProvider('up')}
            shortcut={{ modifiers: ['cmd'], key: 'arrowUp' }}
          />
          <Action
            title='Toggle Provider'
            onAction={() => toggleProvider('down')}
            shortcut={{ modifiers: ['cmd'], key: 'arrowDown' }}
          />
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
        onChange={changeProvider}
        onFocus={event => {
          // @ts-expect-error prevent enum error
          itemProps.model.onFocus?.(event)
        }}
        onBlur={event => {
          // @ts-expect-error prevent enum error
          itemProps.model.onBlur?.(event)
        }}
        info='Press ⌘+↑ or ⌘+↓ to toggle provider.'
      >
        {providers.map((provider, index) => (
          <Form.Dropdown.Item
            key={index}
            value={provider.key}
            title={provider.name}
            icon={{ source: provider.icon, mask: Image.Mask.Circle }}
          />
        ))}
      </Form.Dropdown>

      {providers.find(provider => provider.key === itemProps.provider.value)?.hasReason && (
        <Form.Checkbox
          title='Reason'
          label='Think before responding'
          {...itemProps.reason}
          onChange={newValue => {
            itemProps.reason.onChange?.(newValue)
            cache.set(REASON_CACHE_KEY, newValue.toString())
          }}
        />
      )}

      {providers.find(provider => provider.key === itemProps.provider.value)?.hasSearch && (
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
