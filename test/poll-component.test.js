/**
 * @jest-environment jsdom
 */

import { fireEvent, waitFor } from '@testing-library/dom';
import '@testing-library/jest-dom';
import fetchMock from 'jest-fetch-mock';
import '../frontend/poll-component.js';
import * as api from '../frontend/api.js';
import * as templates from '../frontend/templates.js';
import { generatePollResultsCSV, downloadCSV } from '../frontend/utils/csv-utils.js';

beforeAll(() => {
  // Stub adoptedStyleSheets
  global.CSSStyleSheet = class { replaceSync() {} };
  // Stub alert
  global.alert = jest.fn();
  // Stub createObjectURL for CSV download
  global.URL.createObjectURL = jest.fn(() => 'blob://test');
});

beforeEach(() => {
  fetchMock.resetMocks();
  document.body.innerHTML = '';
  jest.clearAllMocks();
  jest.useFakeTimers();
});

function mountComponent(query = '') {
  // Set URL without triggering navigation
  const url = new URL(`http://localhost${query}`);
  window.history.pushState({}, '', url);
  const el = document.createElement('poll-component');
  document.body.appendChild(el);
  return el;
}

describe('Poll Component', () => {
  it('connectedCallback without code shows main menu', () => {
    const el = mountComponent();
    const root = el.shadowRoot;
    expect(root.querySelector('h1')).toHaveTextContent('📊 Poll System');
    expect(root.getElementById('joinPoll')).toBeVisible();
    expect(root.getElementById('createPoll')).toBeVisible();
    expect(root.getElementById('viewPolls')).toBeVisible();
  });

  it('connectedCallback with code auto-joins poll on error and falls back', async () => {
    jest.spyOn(api, 'joinPoll').mockRejectedValue({});
    const el = mountComponent('?code=XYZ');
    await waitFor(() => {
      const root = el.shadowRoot;
      expect(root.querySelector('h1')).toHaveTextContent('📊 Poll System');
    });
  });

  it('showJoinPoll shows form and validation error when empty', () => {
    const el = mountComponent();
    const root = el.shadowRoot;
    fireEvent.click(root.getElementById('joinPoll'));
    fireEvent.click(root.getElementById('enterPoll'));
    expect(root.getElementById('message')).toHaveTextContent('Please enter a poll code.');
  });

  it('joinPoll success loads questions and updates state', async () => {
    const fake = {
      poll: { code: 'A1', title: 'Test', questions: [{ id:1, question:'Q', type:'single', options:['O1','O2'] }] }
    };
    jest.spyOn(api, 'joinPoll').mockResolvedValue(fake);
    const el = mountComponent();
    const root = el.shadowRoot;
    fireEvent.click(root.getElementById('joinPoll'));
    root.getElementById('pollCode').value = 'A1';
    fireEvent.click(root.getElementById('enterPoll'));
    await waitFor(() => expect(root.querySelector('h1')).toHaveTextContent('Test'));
    expect(el.state.currentPoll).toEqual(fake.poll);
    expect(el.state.userResponses).toEqual([null]);
    expect(root.querySelectorAll('.option-button')).toHaveLength(2);
  });

  it('joinPoll handles 403 banned error', async () => {
    jest.spyOn(api, 'joinPoll').mockRejectedValue({ status:403 });
    const el = mountComponent();
    const root = el.shadowRoot;
    fireEvent.click(root.getElementById('joinPoll'));
    root.getElementById('pollCode').value = 'X';
    fireEvent.click(root.getElementById('enterPoll'));
    await waitFor(() => expect(root.getElementById('message')).toContainHTML('🚫 Access Denied'));
  });

  it('selectOption toggles for single and multiple choice', () => {
    const el = mountComponent();
    // single choice
    el.state.currentPoll = { questions:[{ id:1, type:'single', options:['A','B'] }] };
    el.state.userResponses = [null];
    el.showPollQuestions();
    const [btnA, btnB] = el.shadowRoot.querySelectorAll('.option-button');
    fireEvent.click(btnA);
    expect(btnA).toHaveClass('selected');
    expect(el.state.userResponses[0]).toBe('A');
    fireEvent.click(btnB);
    expect(btnA).not.toHaveClass('selected');
    expect(btnB).toHaveClass('selected');
    // multiple choice
    el.state.currentPoll.questions[0].type = 'multiple';
    el.state.userResponses = [[]];
    el.showPollQuestions();
    const [mA, mB] = el.shadowRoot.querySelectorAll('.option-button');
    fireEvent.click(mA);
    fireEvent.click(mB);
    expect(el.state.userResponses[0]).toEqual(['A','B']);
    fireEvent.click(mA);
    expect(el.state.userResponses[0]).toEqual(['B']);
  });

  it('submitResponses shows error on unanswered', () => {
    const el = mountComponent();
    el.state.currentPoll = { questions:[{ id:1, type:'single', options:[] }] };
    el.state.userResponses = [null];
    el.showPollQuestions();
    fireEvent.click(el.shadowRoot.getElementById('submitResponses'));
    expect(el.shadowRoot.getElementById('message')).toHaveTextContent('Please answer all questions.');
  });

  it('showCreatePoll and resetQuestion work', () => {
    const el = mountComponent();
    fireEvent.click(el.shadowRoot.getElementById('createPoll'));
    const builder = el.shadowRoot.querySelector('.question-builder');
    expect(builder).toBeInTheDocument();
    const qInput = builder.querySelector('.question-input');
    qInput.value = 'foo';
    fireEvent.click(builder.querySelector('.reset-question'));
    expect(qInput.value).toBe('');
    expect(qInput.placeholder).toMatch(/Question \d+/);
  });

  it('addQuestion and addOption increase DOM elements', () => {
    const el = mountComponent();
    fireEvent.click(el.shadowRoot.getElementById('createPoll'));
    const root = el.shadowRoot;
    fireEvent.click(root.getElementById('addQuestion'));
    expect(root.querySelectorAll('.question-builder')).toHaveLength(2);
    const addOpt = root.querySelectorAll('.question-builder')[0].querySelector('.add-option');
    fireEvent.click(addOpt);
    expect(root.querySelectorAll('.option-row')).toHaveLength(1);
  });

  it('createPoll shows errors and success', async () => {
    const el = mountComponent();
    const root = el.shadowRoot;
    fireEvent.click(root.getElementById('createPoll'));
    // missing title/password
    fireEvent.click(root.getElementById('createPollBtn'));
    expect(root.getElementById('message')).toHaveTextContent('Please provide title and admin password.');
    // fill title/pass but missing options
    root.getElementById('pollTitle').value = 'T';
    root.getElementById('adminPassword').value = 'P';
    fireEvent.click(root.getElementById('createPollBtn'));
    expect(root.getElementById('message')).toHaveTextContent('Please fill in all questions and provide at least two options');
    // duplicate options
    const builder = root.querySelector('.question-builder');
    const opts = builder.querySelectorAll('.option-input');
    opts[0].value = 'dup'; opts[1].value = 'dup';
    fireEvent.click(root.getElementById('createPollBtn'));
    expect(root.getElementById('message')).toHaveTextContent('Please ensure all options within each question are unique.');
    // success
    jest.spyOn(api, 'createPoll').mockResolvedValue({ code:'C1' });
    opts[1].value = 'one';
    fireEvent.click(root.getElementById('createPollBtn'));
    await waitFor(() => expect(root.querySelector('.success')).toHaveTextContent('Poll created! Code: C1'));
    const goBtn = root.getElementById('goToAdmin');
    jest.spyOn(el, 'showAdminPanel').mockImplementation(() => {});
    fireEvent.click(goBtn);
    expect(el.showAdminPanel).toHaveBeenCalledWith('C1');
  });

  it('showAllPolls, handleEnterAsAdmin and handleSearchPolls work', async () => {
    const data = { polls:[{ code:'X1', title:'Title1', adminPassword:'p1' }] };
    jest.spyOn(api, 'getAllPolls').mockResolvedValue(data);
    const el = mountComponent();
    fireEvent.click(el.shadowRoot.getElementById('viewPolls'));
    await waitFor(() => expect(el.shadowRoot.querySelector('.poll-list')).toBeInTheDocument());
    const form = el.shadowRoot.querySelector('.admin-access-form');
    const msgEl = form.closest('.poll-item').querySelector('.message-container');
    // wrong password
    form.querySelector('.admin-code-input').value = 'wrong';
    fireEvent.submit(form);
    expect(msgEl).toHaveTextContent('Invalid admin password');
    // correct password
    form.querySelector('.admin-code-input').value = 'p1';
    jest.spyOn(el, 'showAdminPanel').mockImplementation(() => {});
    fireEvent.submit(form);
    expect(el.showAdminPanel).toHaveBeenCalledWith('X1');
    // search filter
    const searchForm = el.shadowRoot.querySelector('.poll-search-form');
    const searchInput = el.shadowRoot.getElementById('pollSearchInput');
    searchInput.value = 'title1';
    fireEvent.submit(searchForm);
    expect(el.shadowRoot.querySelectorAll('.poll-item')).toHaveLength(1);
    // reset search
    fireEvent.reset(searchForm);
    expect(api.getAllPolls).toHaveBeenCalled();
  });

  it('banNewIP, banIP and unbanIP validate input and call API', async () => {
    jest.spyOn(api, 'banIP').mockResolvedValue({ message:'banned' });
    jest.spyOn(api, 'unbanIP').mockResolvedValue({ message:'unok' });
    const el = mountComponent();
    el.state.adminPassword = 'p';
    el.shadowRoot.innerHTML = `<input id="ipToBan" /><div id="banIPMessage"></div><div id="banMessage"></div>`;
    // empty input
    await el.banNewIP('X');
    expect(el.shadowRoot.getElementById('banIPMessage')).toHaveTextContent('Please enter an IP address');
    // invalid format
    el.shadowRoot.getElementById('ipToBan').value = 'bad';
    await el.banNewIP('X');
    expect(el.shadowRoot.getElementById('banIPMessage')).toHaveTextContent('Please enter a valid IP address');
    // valid banNewIP
    el.shadowRoot.getElementById('ipToBan').value = '1.2.3.4';
    jest.spyOn(el, 'showAdminPanel').mockImplementation(() => {});
    await el.banNewIP('X');
    expect(api.banIP).toHaveBeenCalledWith('1.2.3.4', 'X');
    expect(el.showAdminPanel).toHaveBeenCalledWith('X');
    // banIP
    el.shadowRoot.innerHTML = `<div id="banMessage"></div>`;
    await el.banIP('2.2.2.2', 'X');
    expect(api.banIP).toHaveBeenCalledWith('2.2.2.2', 'X');
    expect(el.shadowRoot.getElementById('banMessage')).toHaveTextContent('banned');
    // unbanIP
    el.shadowRoot.innerHTML = `<div id="banIPMessage"></div>`;
    await el.unbanIP('3.3.3.3', 'X');
    expect(api.unbanIP).toHaveBeenCalledWith('3.3.3.3', 'X');
    expect(el.shadowRoot.getElementById('banIPMessage')).toHaveTextContent('unok');
  });

  it('downloadResultsCSV triggers download and shows message', () => {
    const el = mountComponent();
    const data = { poll:{ code:'X' }, results:[] };
    el.shadowRoot.innerHTML = `<div id="banIPMessage"></div><div id="banMessage"></div>`;
    el.downloadResultsCSV(data);
    expect(downloadCSV).toHaveBeenCalled();
    const msg = el.shadowRoot.getElementById('banMessage')?.textContent || el.shadowRoot.getElementById('banIPMessage').textContent;
    expect(msg).toContain('CSV downloaded successfully');
    jest.runAllTimers();
    expect(el.shadowRoot.querySelector('.success')).toBeEmptyDOMElement();
  });
});
