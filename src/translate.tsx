import {
  Form,
  ActionPanel,
  Action,
  closeMainWindow,
  LaunchProps,
  Icon,
  showToast,
  Toast,
} from '@raycast/api'
import { exec } from 'child_process'

const instructions = [
  {
    key: 'portuguese-to-english',
    name: 'Portuguese -> English',
    prompt:
      'Traduza o seguinte texto de Português do Brasil para Inglês.\n\nTexto: """\n${text}\n"""',
  },
  {
    key: 'english-to-portuguese',
    name: 'English -> Portuguese',
    prompt:
      'Traduza o seguinte texto de Inglês para Português do Brasil.\n\nTexto: """\n${text}\n"""',
  },
]

type Schema = {
  text: string
  instructionKey: string
}

export default function Command({ draftValues }: LaunchProps<{ draftValues: Schema }>) {
  const handleSubmit = async ({ instructionKey, text }: Schema) => {
    const instruction = instructions.find(instruction => instruction.key === instructionKey)

    if (!instruction) {
      await showToast({
        title: 'Invalid instruction',
        message: 'Please select a valid instruction.',
        style: Toast.Style.Failure,
      })

      return
    }

    closeMainWindow()

    const prompt = instruction.prompt.replace('${text}', text)

    const url = new URL('https://chatgpt.com')

    url.searchParams.set('q', prompt)

    exec(`open "${url.toString()}"`)
  }

  return (
    <Form
      enableDrafts
      actions={
        <ActionPanel title='Quick AI'>
          <Action.SubmitForm title='Translate' onSubmit={handleSubmit} icon={Icon.Stars} />
          <Action.OpenInBrowser title='Open ChatGPT' url='https://chatgpt.com' />
        </ActionPanel>
      }
    >
      <Form.Dropdown
        id='instructionKey'
        title='Presets'
        defaultValue={draftValues?.instructionKey}
        storeValue
      >
        {instructions.map(instruction => (
          <Form.Dropdown.Item
            key={instruction.key}
            value={instruction.key}
            title={instruction.name}
          />
        ))}
      </Form.Dropdown>

      <Form.TextArea
        id='text'
        title='Text'
        defaultValue={draftValues?.text}
        placeholder='Enter the text to translate'
        autoFocus
        enableMarkdown
      />
    </Form>
  )
}
