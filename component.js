const pollStyles = new CSSStyleSheet();
pollStyles.replaceSync(`
    main {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
    }
    
    #pollContainer {
        text-align: center;
        background-color: #f0f0f0;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    h1 {
        color: #333;
    }
    
    input[type="text"] {
        padding: 10px;
        margin-bottom: 10px;
        width: 200px;
    }
    
    button {
        padding: 10px 15px;
        background-color: #007BFF;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }
    
    button:hover {
        background-color: #0056b3;
    }
`);

class Poll extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.adoptedStyleSheets = [
            pollStyles
        ];
        this.shadowRoot.innerHTML = `
        
        <main>
            <div id="pollContainer">
                <h1>Voting Component</h1>
                <input type="text" id="pollCode" placeholder="Enter Code" />
                <button id="enterPoll">Enter Poll</button>

                <h1>Create Poll</h1>
                <button id="createPoll">Create Poll</button>
            </div>
        </main>
        `;
    }
    
    connectedCallback() {
        this.shadowRoot.getElementById('enterPoll').addEventListener('click', () => {
            const pollCode = this.shadowRoot.getElementById('pollCode').value;
            if (pollCode) {
                fetch('http://localhost:3000/poll/enter', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ code: pollCode })
                })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        throw new Error('Poll entry failed');
                    }
                }
                )
                .then(data => {
                    console.log(data.message);
                })
                .catch(error => {
                    console.error('Error:', error);
                });
            } else {
                alert('Please enter a poll code.');
            }
        }
        );
    }
    
    disconnectedCallback() {
        console.log('Poll component removed from the page.');
    }
}

customElements.define('poll-component', Poll);