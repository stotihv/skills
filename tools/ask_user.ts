#!/usr/bin/env bun

const action = process.env.TOOLBOX_ACTION

// Utility: output error as JSON and exit
function errorExit(code: string, message: string, details: Record<string, any> = {}) {
  console.log(JSON.stringify({
    tool: 'ask_user',
    version: 1,
    status: 'error',
    error: {
      code,
      message,
      ...details
    }
  }))
  process.exit(1)
}

// Utility: normalize options to [{id, label, description}] format
function normalizeOptions(input: any) {
  if (!Array.isArray(input)) {
    throw new Error('options must be an array')
  }
  
  if (input.length < 2) {
    throw new Error('options must have at least 2 items')
  }
  
  if (input.length > 20) {
    throw new Error('options cannot exceed 20 items')
  }
  
  return input.map((opt: any, i: number) => {
    // Handle string shorthand
    if (typeof opt === 'string') {
      return {
        id: String(i + 1),
        label: opt,
        description: ''
      }
    }
    
    // Handle object
    if (typeof opt === 'object' && opt !== null) {
      const label = opt.label || opt.name || ''
      if (!label || label.trim() === '') {
        throw new Error(`option at index ${i} missing or empty label`)
      }
      return {
        id: String(i + 1),
        label: label.trim(),
        description: opt.description ? String(opt.description).trim() : ''
      }
    }
    
    throw new Error(`option at index ${i} invalid type: ${typeof opt}`)
  })
}

// Utility: render markdown for display
function renderMarkdown(question: string, context: string, options: any[]) {
  let md = ''
  if (context) {
    md += `**Context:** ${context}\n\n`
  }
  md += `**Question:** ${question}\n\n`
  options.forEach(opt => {
    const desc = opt.description ? ` — ${opt.description}` : ''
    md += `${opt.id}. ${opt.label}${desc}\n`
  })
  md += '\n_Reply with the option number._'
  return md
}

if (action === 'describe') {
  console.log(JSON.stringify({
    name: 'ask_user',
    description: 'Ask user to choose from multiple approaches. Returns structured prompt for LLM-assisted decision making.',
    args: {
      question: {
        type: 'string',
        required: true,
        description: 'The question or decision point'
      },
      options: {
        type: 'array',
        required: true,
        description: 'Array of 2-20 options. Each can be a string or {label, description} object.',
        example: [
          { label: 'Approach A', description: 'Best for X' },
          { label: 'Approach B', description: 'Best for Y' }
        ]
      },
      context: {
        type: 'string',
        required: false,
        description: 'Optional context explaining why you are asking'
      }
    },
    output: {
      type: 'object',
      description: 'JSON object with status, prompt details, and answer format specification',
      fields: {
        tool: 'string (always "ask_user")',
        version: 'integer (currently 1)',
        status: 'string ("ok" or "error")',
        prompt: 'object with question, context, options, answer_format (on success)',
        error: 'object with code and message (on error)',
        rendered_markdown: 'string with human-readable formatted prompt'
      }
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
    } catch (e) {
      errorExit('INVALID_JSON', 'Failed to parse input as JSON', { parseError: (e as Error).message })
    }
    
    // Validate required fields
    if (!input.question || typeof input.question !== 'string' || input.question.trim() === '') {
      errorExit('MISSING_QUESTION', 'question is required and must be a non-empty string')
    }
    
    if (!input.options) {
      errorExit('MISSING_OPTIONS', 'options is required')
    }
    
    // Try to parse options if it's a stringified JSON
    let optionsArray = input.options
    if (typeof optionsArray === 'string') {
      try {
        optionsArray = JSON.parse(optionsArray)
      } catch (e) {
        errorExit('INVALID_OPTIONS_JSON', 'Failed to parse options as JSON', { parseError: (e as Error).message })
      }
    }
    
    // Normalize options
    let normalizedOptions
    try {
      normalizedOptions = normalizeOptions(optionsArray)
    } catch (e) {
      errorExit('INVALID_OPTIONS', (e as Error).message)
    }
    
    const question = input.question.trim()
    const context = input.context ? String(input.context).trim() : ''
    
    // Build response
    const maxOptionId = normalizedOptions.length
    const response: any = {
      tool: 'ask_user',
      version: 1,
      status: 'ok',
      prompt: {
        question,
        ...(context && { context }),
        kind: 'single_select',
        options: normalizedOptions,
        answer_instructions: `Reply with the option number (1-${maxOptionId}).`,
        answer_format: {
          type: 'integer',
          min: 1,
          max: maxOptionId
        }
      },
      rendered_markdown: renderMarkdown(question, context, normalizedOptions)
    }
    
    console.log(JSON.stringify(response))
    process.exit(0)
    
  } catch (e) {
    errorExit('INTERNAL_ERROR', 'Unexpected error', { error: (e as Error).message })
  }
}
