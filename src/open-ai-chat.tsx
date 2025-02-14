import { Form, ActionPanel, Action, closeMainWindow, LaunchProps, Icon } from '@raycast/api'
import { exec } from 'child_process'

type Schema = {
  prompt: string
  model: 'o3-mini' | 'GPT-4o'
}

export default function Command({ draftValues }: LaunchProps<{ draftValues: Schema }>) {
  const handleSubmit = async ({ prompt, model }: Schema) => {
    closeMainWindow()

    const url = new URL('https://chatgpt.com/')

    url.searchParams.set('q', prompt)

    if (model === 'o3-mini') {
      url.searchParams.set('hints', 'reason')
    }

    exec(`open "${url.toString()}"`)
  }

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
        id='prompt'
        title='Prompt'
        defaultValue={draftValues?.prompt}
        placeholder='What can I help with?'
        autoFocus
        enableMarkdown
      />

      <Form.Dropdown id='model' title='Model' defaultValue='o3-mini'>
        <Form.Dropdown.Item value='o3-mini' title='o3-mini' />
        <Form.Dropdown.Item value='GPT-4o' title='GPT-4o' />
      </Form.Dropdown>
    </Form>
  )
}
