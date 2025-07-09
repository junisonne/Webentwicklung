/**
 * @jest-environment jsdom
 */

import { fireEvent, waitFor } from '@testing-library/dom';
import '@testing-library/jest-dom';
import fetchMock from 'jest-fetch-mock';
import '../frontend/poll-component.js';
import * as api from '../frontend/api.js';
import * as csvUtils from '../frontend/utils/csvUtils.js';

beforeAll(() => {
  global.CSSStyleSheet = class { replaceSync() {} };
  global.alert = jest.fn();
  global.URL.createObjectURL = jest.fn(() => 'blob://test');
  global.URL.revokeObjectURL = jest.fn();
  jest.spyOn(csvUtils, 'downloadCSV');
});

beforeEach(() => {
  fetchMock.resetMocks();
  document.body.innerHTML = '';
  jest.clearAllMocks();
  jest.useFakeTimers();
});

function mountComponent(query = '') {
  const url = new URL(`http://localhost${query}`);
  window.history.pushState({}, '', url);
  const el = document.createElement('poll-component');
  document.body.appendChild(el);
  return el;
}

describe('Poll Component', () => {
  it('connectedCallback without code shows main menu', async () => {
    const el = mountComponent();
    await waitFor(() => {
      const root = el.shadowRoot;
      expect(root.querySelector('h1')).toHaveTextContent('📊 Poll System');
      expect(root.getElementById('joinPoll')).toBeVisible();
      expect(root.getElementById('createPoll')).toBeVisible();
      expect(root.getElementById('viewPolls')).toBeVisible();
    });
  });

  it('connectedCallback with code auto-joins poll on error and falls back', async () => {
    jest.spyOn(api, 'joinPoll').mockRejectedValue({});
    const el = mountComponent('?code=XYZ');
    await waitFor(() => {
      const root = el.shadowRoot;
      expect(root.querySelector('h1')).toHaveTextContent('📊 Poll System');
    });
  });

  it('showJoinPoll shows form and validation error when empty', async () => {
    const el = mountComponent();
    const root = el.shadowRoot;
    await waitFor(() => expect(root.getElementById('joinPoll')).toBeInTheDocument());
    fireEvent.click(root.getElementById('joinPoll'));
    await waitFor(() => expect(root.getElementById('enterPoll')).toBeInTheDocument());
    fireEvent.click(root.getElementById('enterPoll'));
    await waitFor(() => expect(root.getElementById('message')).toHaveTextContent('Please enter a poll code.'));
  });

  it('joinPoll success loads questions and updates state', async () => {
    const fake = {
      poll: { code: 'A1', title: 'Test', questions: [{ id: 1, question: 'Q', type: 'single', options: ['O1', 'O2'] }] }
    };
    jest.spyOn(api, 'joinPoll').mockResolvedValue(fake);
    const el = mountComponent();
    const root = el.shadowRoot;
    await waitFor(() => expect(root.getElementById('joinPoll')).toBeInTheDocument());
    fireEvent.click(root.getElementById('joinPoll'));
    await waitFor(() => expect(root.getElementById('pollCode')).toBeInTheDocument());
    root.getElementById('pollCode').value = 'A1';
    fireEvent.click(root.getElementById('enterPoll'));
    await waitFor(() => expect(root.querySelector('h1')).toHaveTextContent('Test'));
    expect(el.state.currentPoll).toEqual(fake.poll);
    expect(el.state.userResponses).toEqual([null]);
    expect(root.querySelectorAll('.option-button')).toHaveLength(2);
  });

  it('joinPoll handles 403 banned error', async () => {
    jest.spyOn(api, 'joinPoll').mockRejectedValue({ status: 403 });
    const el = mountComponent();
    const root = el.shadowRoot;
    await waitFor(() => expect(root.getElementById('joinPoll')).toBeInTheDocument());
    fireEvent.click(root.getElementById('joinPoll'));
    await waitFor(() => expect(root.getElementById('pollCode')).toBeInTheDocument());
    root.getElementById('pollCode').value = 'X';
    fireEvent.click(root.getElementById('enterPoll'));
    await waitFor(() => expect(root.getElementById('message')).toContainHTML('🚫 Access Denied'));
  });

  it('selectOption toggles for single and multiple choice', async () => {
    const el = mountComponent();
    el.state.currentPoll = { questions: [{ id: 1, type: 'single', options: ['A', 'B'] }] };
    el.state.userResponses = [null];
    el.showPollQuestions();
    await waitFor(() => expect(el.shadowRoot.querySelectorAll('.option-button').length).toBe(2));
    const [btnA, btnB] = el.shadowRoot.querySelectorAll('.option-button');
    fireEvent.click(btnA);
    expect(btnA).toHaveClass('selected');
    expect(el.state.userResponses[0]).toBe('A');
    fireEvent.click(btnB);
    expect(btnA).not.toHaveClass('selected');
    expect(btnB).toHaveClass('selected');
    el.state.currentPoll.questions[0].type = 'multiple';
    el.state.userResponses = [[]];
    el.showPollQuestions();
    await waitFor(() => expect(el.shadowRoot.querySelectorAll('.option-button').length).toBe(2));
    const [mA, mB] = el.shadowRoot.querySelectorAll('.option-button');
    fireEvent.click(mA);
    fireEvent.click(mB);
    expect(el.state.userResponses[0]).toEqual(['A', 'B']);
    fireEvent.click(mA);
    expect(el.state.userResponses[0]).toEqual(['B']);
  });

  it('submitResponses shows error on unanswered', async () => {
    const el = mountComponent();
    el.state.currentPoll = { questions: [{ id: 1, type: 'single', options: [] }] };
    el.state.userResponses = [null];
    await el.showPollQuestions();
    fireEvent.click(el.shadowRoot.getElementById('submitResponses'));
    expect(el.shadowRoot.getElementById('message')).toHaveTextContent('Please answer all questions.');
  });

  it('showCreatePoll and resetQuestion work', async () => {
    const el = mountComponent();
    const root = el.shadowRoot;
    await waitFor(() => expect(root.getElementById('createPoll')).toBeInTheDocument());
    fireEvent.click(root.getElementById('createPoll'));
    await waitFor(() => expect(root.querySelector('.question-builder')).toBeInTheDocument());
    const qInput = root.querySelector('.question-builder .question-input');
    qInput.value = 'foo';
    fireEvent.click(root.querySelector('.reset-question'));
    expect(qInput.value).toBe('');
    expect(qInput.placeholder).toMatch(/Question \d+/);
  });

  it('addQuestion and addOption increase DOM elements', async () => {
    const el = mountComponent();
    const root = el.shadowRoot;
    await waitFor(() => expect(root.getElementById('createPoll')).toBeInTheDocument());
    fireEvent.click(root.getElementById('createPoll'));
    await waitFor(() => expect(root.querySelector('.question-builder')).toBeInTheDocument());
    fireEvent.click(root.getElementById('addQuestion'));
    expect(root.querySelectorAll('.question-builder')).toHaveLength(2);
    fireEvent.click(root.querySelector('.question-builder .add-option'));
    expect(root.querySelectorAll('.option-row')).toHaveLength(1);
  });
});
