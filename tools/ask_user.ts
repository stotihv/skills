#!/usr/bin/env bun

const action = process.env.TOOLBOX_ACTION

function errorExit(message: string) {
  console.log(`Error: ${message}`)
  process.exit(1)
}

function normalizeOptions(input: any) {
  if (!Array.isArray(input)) throw new Error('options must be an array')
  if (input.length < 2) throw new Error('options must have at least 2 items')
  if (input.length > 20) throw new Error('options cannot exceed 20 items')
  
  return input.map((opt: any, i: number) => {
    if (typeof opt === 'string') {
      return { id: i + 1, label: opt, description: '' }
    }
    if (typeof opt === 'object' && opt !== null) {
      const label = opt.label || opt.name || ''
      if (!label?.trim()) throw new Error(`option ${i + 1} missing label`)
      return { id: i + 1, label: label.trim(), description: opt.description?.trim() || '' }
    }
    throw new Error(`option ${i + 1} invalid`)
  })
}

if (action === 'describe') {
  console.log(JSON.stringify({
    name: 'ask_user',
    description: 'Ask user to choose from multiple approaches. Displays question with numbered options for easy selection.',
    args: {
      question: { type: 'string', required: true, description: 'The question or decision point' },
      options: { type: 'array', required: true, description: 'Array of 2-20 options. Each: string or {label, description}' },
      context: { type: 'string', required: false, description: 'Optional brief context' }
    }
  }))
  process.exit(0)
}

if (action === 'execute') {
  try {
    const inputText = await Bun.stdin.text()
    let input: any
    
    try {
      input = JSON.parse(inputText)
    } catch {
      errorExit('Invalid JSON input')
    }
    
    if (!input.question?.trim()) errorExit('question is required')
    if (!input.options) errorExit('options is required')
    
    let optionsArray = input.options
    if (typeof optionsArray === 'string') {
      try { optionsArray = JSON.parse(optionsArray) } catch { errorExit('Invalid options JSON') }
    }
    
    const options = normalizeOptions(optionsArray)
    const question = input.question.trim()
    const context = input.context?.trim() || ''
    
    // Clean display output
    let output = ''
    if (context) output += `${context}\n\n`
    output += `**${question}**\n\n`
    
    options.forEach(opt => {
      output += `${opt.id}. **${opt.label}**`
      if (opt.description) output += ` — ${opt.description}`
      output += '\n'
    })
    
    console.log(output.trim())
    process.exit(0)
    
  } catch (e) {
    errorExit((e as Error).message)
  }
}
