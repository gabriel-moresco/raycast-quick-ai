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

const MODEL_CACHE_KEY = '@open-ai-chat:model'
const SEARCH_CACHE_KEY = '@open-ai-chat:search'

const models = ['o3-mini', 'gpt-4o'] as const

type Model = (typeof models)[number]

type Schema = {
  prompt: string
  model: Model
  search: boolean
}

const cache = new Cache()

export default function Command({ draftValues }: LaunchProps<{ draftValues: Schema }>) {
  const onSubmit = async (values: Schema) => {
    const { prompt, model: modelValue, search } = values
    const model = modelValue as Model

    let hints: string | null = null

    const url = new URL('https://chatgpt.com')

    url.searchParams.set('q', prompt)

    if (model === 'o3-mini') {
      hints = hints ? `${hints},reason` : 'reason'
    }

    if (model === 'gpt-4o' && search) {
      hints = hints ? `${hints},search` : 'search'
    }

    if (hints) {
      url.searchParams.set('hints', hints)
    }

    closeMainWindow({ popToRootType: PopToRootType.Immediate })

    exec(`open "${url.toString()}"`)
  }

  const defaultPrompt: string = draftValues ? draftValues.prompt : ''
  const defaultModel: Model = draftValues
    ? (draftValues.model as Model)
    : cache.has(MODEL_CACHE_KEY)
      ? (cache.get(MODEL_CACHE_KEY) as Model)
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
        title='Model'
        {...itemProps.model}
        onChange={newValue => {
          itemProps.model.onChange?.(newValue as Model)
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
        {models.map((model, index) => (
          <Form.Dropdown.Item key={index} value={model} title={model} />
        ))}
      </Form.Dropdown>

      {(itemProps.model.value as Model) === 'o3-mini' && (
        <Form.Checkbox
          id='reason'
          title='Reason'
          label='Think before responding'
          value={true}
          // This is a read-only checkbox
          onChange={() => {}}
        />
      )}

      {(itemProps.model.value as Model) === 'gpt-4o' && (
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
