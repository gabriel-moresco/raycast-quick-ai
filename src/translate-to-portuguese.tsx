import { Form, ActionPanel, Action, closeMainWindow, LaunchProps, Icon } from '@raycast/api'
import { exec } from 'child_process'

type Schema = {
  prompt: string
}

export default function Command({ draftValues }: LaunchProps<{ draftValues: Schema }>) {
  const handleSubmit = async ({ prompt }: Schema) => {
    closeMainWindow()

    prompt = `Traduza o seguinte texto de Inglês para Português do Brasil.\n\nTexto: """\n${prompt}\n"""`

    const url = new URL('https://chatgpt.com')

    url.searchParams.set('q', prompt)

    exec(`open "${url.toString()}"`)
  }

  return (
    <Form
      enableDrafts
      actions={
        <ActionPanel title='Quick AI'>
          <Action.SubmitForm
            title='Translate to Portuguese'
            onSubmit={handleSubmit}
            icon={Icon.Stars}
          />
          <Action.OpenInBrowser title='Open ChatGPT' url='https://chatgpt.com' />
        </ActionPanel>
      }
    >
      <Form.Description text='English -> Portuguese.' />

      <Form.TextArea
        id='prompt'
        title='Text to translate'
        defaultValue={draftValues?.prompt}
        placeholder='Enter the text to translate'
        autoFocus
        enableMarkdown
      />
    </Form>
  )
}
