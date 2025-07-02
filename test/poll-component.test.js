/**
 * @jest-environment jsdom
 */

import { getByText, fireEvent, waitFor } from '@testing-library/dom'
import '@testing-library/jest-dom'
import fetchMock from 'jest-fetch-mock'
import '../frontend/poll-component.js'

beforeAll(() => {
  // stub CSSStyleSheet
  global.CSSStyleSheet = class {
    replaceSync() {}
  }
})

beforeEach(() => {
  fetchMock.resetMocks()
  document.body.innerHTML = ''
})

function mountComponent(query = '') {
  delete window.location
  window.location = new URL(`http://localhost${query}`)
  const el = document.createElement('poll-component')
  document.body.appendChild(el)
  return el
}

test('connectedCallback ohne code rendert Main Menu', () => {
  const el = mountComponent()
  const root = el.shadowRoot
  expect(root.querySelector('h1')).toHaveTextContent('📊 Poll System')
  expect(root.getElementById('joinPoll')).toBeInTheDocument()
  expect(root.getElementById('createPoll')).toBeInTheDocument()
  expect(root.getElementById('viewPolls')).toBeInTheDocument()
})

test('showJoinPoll zeigt Eingabeformular und Fehlermeldung bei leerem Code', () => {
  const el = mountComponent()
  const root = el.shadowRoot
  fireEvent.click(root.getElementById('joinPoll'))
  fireEvent.click(root.getElementById('enterPoll'))
  expect(root.getElementById('message')).toHaveTextContent('Please enter a poll code.')
})

test('joinPoll lädt Fragen und rendert Poll Questions', async () => {
  const fakePoll = {
    poll: {
      code: 'ABC123',
      title: 'Fun Poll',
      questions: [
        { id: 1, question: 'Q1?', type: 'single', options: ['O1','O2'] }
      ]
    }
  }
  fetchMock.mockResponseOnce(JSON.stringify(fakePoll))
  const el = mountComponent()
  const root = el.shadowRoot
  fireEvent.click(root.getElementById('joinPoll'))
  const input = root.getElementById('pollCode')
  input.value = 'ABC123'
  fireEvent.click(root.getElementById('enterPoll'))
  await waitFor(() => {
    expect(root.querySelector('h1')).toHaveTextContent('Fun Poll')
  })
  const btns = root.querySelectorAll('.option-button')
  expect(btns.length).toBe(2)
})

test('selectOption single choice markiert und State updated', async () => {
  const el = mountComponent()
  el.state.currentPoll = {
    code: 'X',
    title: 'T',
    questions: [{ id:1, question:'Q', type:'single', options:['A','B'] }]
  }
  el.state.userResponses = [null]
  el.showPollQuestions()
  const root = el.shadowRoot
  const btnA = root.querySelector('[data-option="A"]')
  const btnB = root.querySelector('[data-option="B"]')
  fireEvent.click(btnA)
  expect(btnA).toHaveClass('selected')
  expect(el.state.userResponses[0]).toBe('A')
  fireEvent.click(btnB)
  expect(btnA).not.toHaveClass('selected')
  expect(btnB).toHaveClass('selected')
  expect(el.state.userResponses[0]).toBe('B')
})

test('submitResponses zeigt Fehler, wenn nicht alle Fragen beantwortet', () => {
  const el = mountComponent()
  el.state.currentPoll = {
    code: 'X',
    title: 'T',
    questions: [{ id:1, question:'Q', type:'single', options:[] }]
  }
  el.state.userResponses = [null]
  el.showPollQuestions()
  fireEvent.click(el.shadowRoot.getElementById('submitResponses'))
  expect(el.shadowRoot.getElementById('message')).toHaveTextContent('Please answer all questions.')
})

test('showCreatePoll und addQuestion / addOption funktionieren', () => {
  const el = mountComponent()
  fireEvent.click(el.shadowRoot.getElementById('createPoll'))
  const root = el.shadowRoot
  expect(root.querySelectorAll('.question-builder').length).toBe(1)
  fireEvent.click(root.getElementById('addQuestion'))
  expect(root.querySelectorAll('.question-builder').length).toBe(2)
  const firstAddOpt = root.querySelector('.question-builder .add-option')
  fireEvent.click(firstAddOpt)
  expect(root.querySelectorAll('.option-row').length).toBe(1)
})
