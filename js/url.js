

let hints = document.createElement("hints");

export async function getAvailableFunctions(moduleName) {
    try {

        await pyodide.runPythonAsync(`
        import inspect

        def get_available_functions(identifier):
            try:
                # Define a dictionary of known globals
                known_globals = {
                    '__builtins__': __import__('builtins'),
                    'inspect': inspect,
                    'math': __import__('math'),
                    # Add other modules or variables as needed
                }
        
                # Attempt to evaluate the identifier with the known globals
                obj = eval(identifier, known_globals)
        
                # Determine the type of the object
                obj_type = type(obj).__name__
        
                # Get attributes and functions
                attributes = []
                functions = []
        
                if obj_type == 'module':
                    # For modules, get a list of attribute names
                    attributes = dir(obj)
                elif obj_type == 'class':
                    # For classes, get a list of attribute names and method names
                    attributes = dir(obj)
                    functions = [name for name, attr in inspect.getmembers(obj) if inspect.isfunction(attr)]
                elif obj_type == 'function' or obj_type=='builtin_function_or_method':
                    # For functions, get their signature using inspect
                    signature = inspect.signature(obj)
                    functions = [f'{obj.__name__}{signature}']
                else:
                    # For variables, return an empty list of attributes and functions
                    pass
        
                return {
                    'type': obj_type,
                    'attributes': attributes,
                    'functions': functions
                }
        
            except Exception as e:
                return {
                    'type': 'unknown',
                    'attributes': [],
                    'functions': [],
                    'error': str(e)
                }
        
        `);

        await pyodide.runPythonAsync(`available_functions = get_available_functions('${moduleName}')`);

        const availableFunctions = pyodide.globals.get('available_functions').toJs();

        let data = {
            list: []
        };
                
        // Create suggestions from the results
        availableFunctions.forEach((value, key) => {
            if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    let suggestionItem = {
                        text: item,
                        from: { line: data.list.length, ch: 0 },
                        to: { line: data.list.length, ch: item.length }
                    };
                    data.list.push(suggestionItem);
                });
            } else {
                let suggestionItem = {
                    text: value,
                    from: { line: data.list.length, ch: 0 },
                    to: { line: data.list.length, ch: value.length } 
                };
                data.list.push(suggestionItem);
            }
        });

        return data;
       
    } catch (error) {
        console.error('Error:', error);
    }
}

async function computeTabCompletionOptions() {
    var cursor = editor.getCursor();

    var line = editor.getLine(cursor.line);

    let computedOptions=['a', 'b', 'c'];
    
    const wordRegex = /[\w$]+(\.)?/g;

    let words = line.match(wordRegex);

    let currentWord = '';
    if (words) {
        for (var i = 0; i < words.length; i++) {
            var word = words[i];
            var wordStart = line.indexOf(word);
            var wordEnd = wordStart + word.length;

            if (cursor.ch >= wordStart && cursor.ch <= wordEnd) {
                currentWord = word;
                break;
            }
        }
    }

    let data = await getAvailableFunctions(currentWord);


    console.log("Tab completion options:", data, 'Current Word', currentWord);
    return data;
}

  
export function initializeCodeMirror() {
    let editor = CodeMirror(document.getElementById("queryEditor"), {
    mode: "python", 
    lineNumbers: true,
    extraKeys: {"Ctrl-Space": "autocomplete"},
    value: getDataFromURL(), 
    
    });
    editor.getWrapperElement().id = "codeMirrorUpper";

    editor.on("change", () => {
        updateURL();
    });

    CodeMirror.commands.autocomplete = function (cm) {

        cm.showHint({
            hint: computeTabCompletionOptions, 
            completeSingle: false, 
        });
        cm.addWidget(cm.getCursor(), hints, true);

    };

    editor.on("mousemove", function (event) {
        return;

    });

    editor.on("mouseout", function () {
    });

    globalThis.editor = editor
}



const mydictionary = 'importprintdef():forinwhileifhello    '
export function updateURL() {
    const inputData = editor.getValue();
    
    const compressedData = pako.deflate(inputData, { to: 'string', dictionary: mydictionary}); 
    const compressedAndEncodedData = btoa(compressedData);

    const currentURL = new URL(window.location.href);

    let imports = document.getElementById('imports').value;
   
    history.replaceState(null, null, currentURL.toString());

    window.location.hash = 'i=' + encodeURIComponent(imports) + '&d=' + compressedAndEncodedData;

    console.log("URL length = ", window.location.length);

}

function getDataFromURL() {
    const url = new URL(window.location.href);

    let hash = window.location.hash.substr(1);
    let params = new URLSearchParams(hash);
    let imports = params.get('i');

    document.getElementById('imports').value = imports;

    
    let data = params.get('d');
    if (data === null || data.length == 0){
        return '';
    }
    else{
        console.log("URL data (len " + data.length + ")", data);
        const decodedData = atob(data);
        const numberArray = decodedData.split(',').map(Number);
        const decompressedData = pako.inflate(numberArray, { to: 'string', dictionary: mydictionary });
        return decompressedData
    }
}


