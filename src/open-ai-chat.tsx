import { Form, ActionPanel, Action, closeMainWindow, LaunchProps, Icon } from '@raycast/api'
import { useForm } from '@raycast/utils'
import { exec } from 'child_process'

type Schema = {
  prompt: string
  model: string
  search: boolean
}

const models = ['o3-mini', 'GPT-4o'] as const

type Model = (typeof models)[number]

export default function Command({ draftValues }: LaunchProps<{ draftValues: Schema }>) {
  const onSubmit = async (values: Schema) => {
    const { prompt, model: modelValue, search } = values
    const model = modelValue as Model

    closeMainWindow()

    let hints: string | null = null

    const url = new URL('https://chatgpt.com')

    url.searchParams.set('q', prompt)

    if (model === 'o3-mini') {
      hints = hints ? `${hints},reason` : 'reason'
    }

    if (model === 'GPT-4o' && search) {
      hints = hints ? `${hints},search` : 'search'
    }

    if (hints) {
      url.searchParams.set('hints', hints)
    }

    exec(`open "${url.toString()}"`)
  }

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
      prompt: draftValues?.prompt ?? '',
      model: draftValues?.model ?? models[0],
      search: draftValues?.search ?? false,
    },
  })

  return (
    <Form
      enableDrafts
      actions={
        <ActionPanel title='Quick AI'>
          <Action.SubmitForm title='Open AI Chat' onSubmit={handleSubmit} icon={Icon.Stars} />

          <Action.OpenInBrowser title='Open ChatGPT' url='https://chatgpt.com' />
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

      <Form.Dropdown title='Model' {...itemProps.model}>
        {models.map((model, index) => (
          <Form.Dropdown.Item key={index} value={model} title={model} />
        ))}
      </Form.Dropdown>

      {itemProps.model.value && (itemProps.model.value as Model) === 'o3-mini' && (
        <Form.Checkbox id='reason' title='Reason' label='Think before responding' value={true} />
      )}

      {itemProps.model.value && (itemProps.model.value as Model) === 'GPT-4o' && (
        <Form.Checkbox title='Search' label='Search the web' {...itemProps.search} />
      )}
    </Form>
  )
}
