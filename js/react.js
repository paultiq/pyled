import React from 'https://cdn.jsdelivr.net/npm/react@18.2.0/+esm';
import { Button } from 'https://cdn.jsdelivr.net/npm/@mui/material@5.14.10/+esm';

import reactResizable from 'https://cdn.jsdelivr.net/npm/react-resizable@3.0.5/+esm';
import ReactDOM from 'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/+esm';

export default function ResizableDivs() {
    const halfViewportHeight = window.innerHeight / 2;

    const githubIcon = React.createElement('a', {
        href: 'https://github.com/paultiq/pyled',
        target: '_blank',
        style: { marginLeft: '10px' }
    }, "🐙");

    const pyledLink = React.createElement('a', {
        href: 'https://paultiq.github.io/pyled',
        style: { textDecoration: 'none', color: 'white' },
        target: '_blank'
    }, "pyled");

    const header = React.createElement('div', {
        style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px',
            backgroundColor: '#333',
            color: 'white'
        }
    }, [pyledLink, githubIcon]);

    const textArea = React.createElement('textarea', {
        id: "imports",
        placeholder: "Enter imports",
        defaultValue: "Pandas",
        style: { width: '100%', minHeight: '12px', marginTop: '10px' },
        onChange: (e) => {
            globalThis.updateURL();
        }
    });

    const imports = React.createElement('div', {
        id: "importsRow",
        style: { width: '100%', background: '#ddd', flexShrink: 0 },
    }, textArea);

    const buttons = React.createElement('div',
        {
            style: {
                display: 'flex',
                gap: '10px',
                padding: '0px 0',
                position: 'sticky',
                bottom: 0,
                background: '#ddd',
                justifyContent: 'center'  // Right-align the buttons
            }
        },
        [
            React.createElement(Button, { id: 'clearBtn', disabled: false }, 'Clear'),
            React.createElement(Button, { id: 'loadBtn', disabled: false }, 'Load Pkgs'),
            React.createElement(Button, { id: 'runBtn', disabled: false }, 'Run All'),
        ]
    );

    const queryEditor = React.createElement('div', {
        id: "queryEditor",
        style: { width: '100%', flex: 1, overflow: 'auto', background: '#ddd' },
    });

    const upperDivContent = React.createElement('div', {
        id: "editorContainer",
        style: { width: '100%', height: '100%', background: '#ddd', display: 'flex', flexDirection: 'column' },
    }, queryEditor, buttons);

    const lowerDivContent = React.createElement('div', {
        id: "bottom",
        style: { width: '100%', height: '100%', background: '#eee', overflowY: 'auto' },
    });

    const resizableUpperDiv = React.createElement(reactResizable.ResizableBox, {
        width: '100%',
        height: halfViewportHeight,
        axis: 'y',
        style: { flex: '1 1 auto' }
    }, upperDivContent);

    const container = React.createElement('div', {
        style: {
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100vh'
        }
    }, [header, imports, resizableUpperDiv, lowerDivContent]);

    return container;
}

const loadingModal = React.createElement(
    'div',
    {
        id: 'loadingModal',
        style: {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'none',
            justifyContent: 'center',
            alignItems: 'center'
        }
    },
    React.createElement(
        'div',
        {
            id: 'loadingModalText',
            style: {
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '5px'
            }
        },
        'Loading Pyodide...'
    )
);

ReactDOM.render([React.createElement(ResizableDivs, null, null), loadingModal], document.getElementById('root'));
