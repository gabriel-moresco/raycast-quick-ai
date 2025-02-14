import { Form, ActionPanel, Action, closeMainWindow, LaunchProps, Icon } from '@raycast/api'
import { useForm } from '@raycast/utils'
import { exec } from 'child_process'

const instructionKeys = ['portuguese-to-english', 'english-to-portuguese'] as const

type InstructionKey = (typeof instructionKeys)[number]

type Instruction = {
  key: InstructionKey
  name: string
  prompt: string
}

const instructions: Instruction[] = [
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
  instructionKey: string
  text: string
  instructionPrompt: string
}

export default function Command({ draftValues }: LaunchProps<{ draftValues: Schema }>) {
  const onSubmit = async ({ text, instructionPrompt }: Schema) => {
    closeMainWindow()

    const prompt = instructionPrompt.replace('${text}', text)

    const url = new URL('https://chatgpt.com')

    url.searchParams.set('q', prompt)

    exec(`open "${url.toString()}"`)
  }

  const { handleSubmit, itemProps, setValue } = useForm<Schema>({
    onSubmit,
    validation: {
      text: (value: string | undefined) => {
        if (!value || value.length === 0) {
          return 'Text is required.'
        }
      },
      instructionPrompt: (value: string | undefined) => {
        if (!value || value.length === 0) {
          return 'Instructions are required.'
        }

        const validInstructions = value.includes('${text}')

        if (!validInstructions) {
          return 'Invalid instructions. Please include ${text} key in the instructions.'
        }
      },
    },
    initialValues: {
      instructionKey: draftValues?.instructionKey ?? instructions[0].key,
      text: draftValues?.text ?? '',
      instructionPrompt: draftValues?.instructionPrompt ?? instructions[0].prompt,
    },
  })

  const onChangePreset = (newInstructionKey: string) => {
    const instruction = instructions.find(instruction => instruction.key === newInstructionKey)

    const oldInstructionKey = itemProps.instructionKey.value

    if (instruction && newInstructionKey !== oldInstructionKey) {
      setValue('instructionPrompt', instruction.prompt)
    }

    itemProps.instructionKey.onChange?.(newInstructionKey)
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
      <Form.Dropdown title='Preset' {...itemProps.instructionKey} onChange={onChangePreset}>
        {instructions.map(instruction => (
          <Form.Dropdown.Item
            key={instruction.key}
            value={instruction.key}
            title={instruction.name}
          />
        ))}
      </Form.Dropdown>

      <Form.TextArea
        title='Text'
        placeholder='Enter the text to translate'
        autoFocus
        enableMarkdown
        {...itemProps.text}
      />

      <Form.TextArea title='Instructions' enableMarkdown {...itemProps.instructionPrompt} />
    </Form>
  )
}
