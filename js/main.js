let pyodide = null;

let indexURL = "https://cdn.jsdelivr.net/pyodide/dev/pyc/pyodide.mjs";
const { loadPyodide } = await import(indexURL);

const button = document.getElementById("generateBtn");
const outputDiv = document.getElementById("bottom");
const loadables = ['numpy', 'pandas', 'matplotlib']

async function pyStdErr(msg) {
    const outdiv = document.createElement("div");
    outdiv.textContent = msg;
    outdiv.style.color = "red";
    outdiv.style.whiteSpace = "pre"; 
    document.getElementById("bottom").appendChild(outdiv);
    document.getElementById("bottom").scrollTop = document.getElementById("bottom").scrollHeight;
}
async function pyStdOut(msg) {
    const outdiv = document.createElement("div");
    outdiv.textContent = msg;
    outdiv.style.whiteSpace = "pre"; 
    document.getElementById("bottom").appendChild(outdiv);
    document.getElementById("bottom").scrollTop = document.getElementById("bottom").scrollHeight;
}

export function render_plot(container, plot_html) {
    console.log("Rendering plot")
    var range = document.createRange();
    range.selectNode(container);
    var documentFragment = range.createContextualFragment(plot_html);
    while (container.hasChildNodes()) {  
      container.removeChild(container.firstChild);
    }
    container.appendChild(documentFragment);
    container.className = "plotly";
  };

  
export function render_griddf(containerId, df_json) {
        const rowData = JSON.parse(df_json);
        
        const columnDefs = Object.keys(rowData[0]).map(key => ({
            headerName: key,
            field: key
        }));
        
        const gridOptions = { 
            defaultColDef: {sortable: true, filter: true},
            animateRows: false, 
            columnDefs: columnDefs,
            rowData: rowData,
            domLayout: 'autoHeight',
            pagination: true,
            paginationPageSize: 10
        };
    

        const container = document.getElementById(containerId);
        container.classList.add('ag-theme-alpine');
        new agGrid.Grid(container, gridOptions);
    }
    
export async function loadPyodideAndPackages() {
    // loadingModal: Show
    document.getElementById("loadingModal").style.display = "flex";
    document.getElementById("loadingModalText").innerHTML = "Loading Pyodide";
    
    const importStr = document.getElementById("imports").value

    let loadArr = ['micropip', 'pandas', 'matplotlib']
    let importArr = []
    
    if (importStr !== null && importStr.length>0){
        let importArrBox = importStr.split(/[ ,]+/);

        for (let item of importArrBox) {
            if (loadables.includes(item)){
                loadArr.push(item);
            }
            else{
                importArr.push(item);
            }
        }
        console.log("loadArr", loadArr)
        console.log("importArr", importArr)
    
    }
    globalThis.pyodide = await loadPyodide({packages: loadArr});

    if (importArr.length > 0){
        document.getElementById("loadingModalText").innerHTML = "Loading Additional Packages via MicroPip: " + importArr;
        
        try {
            globalThis.importArr = importArr
            await globalThis.pyodide.runPython(`
            from js import importArr
            import micropip
            import pyodide
            print(f"Pyodide Version: {pyodide.__version__}")
            micropip.install(importArr)
                `);       
        } catch (error) {
            console.error('An error occurred:', error);
            pyStdErr(error);
        }
    }


    
    globalThis.pyodide.setStderr({ batched: pyStdErr })
    globalThis.pyodide.setStdout({ batched: pyStdOut })
    
    globalThis.pyodide.runPython(`
# No initialization needed right now, but this makes sure things worked
    `);

    document.getElementById("loadingModal").style.display = "none";

}


export async function registerHelpers() {
    // Register display() helper
    // This is comparable to display() behavior in iPython
    await globalThis.pyodide.runPython(`
import js
def _display(displayResult, aggrid_df = True, output_div = 'bottom'):

    if str(type(displayResult)) == "<class 'plotly.graph_objs._figure.Figure'>": # avoid importing plotly
        fig = displayResult
        fig_html = fig.to_html(
            include_plotlyjs=False,
            full_html=False,
            default_height='350px'
          )
        plot_output = js.document.getElementById(output_div)
        js.render_plot(plot_output, fig_html)
    elif not aggrid_df and str(type(displayResult)) == "<class 'pandas.core.frame.DataFrame'>":
        print("Rendering DataFrame")
        plot_output = js.document.getElementById(output_div)
        plot_output.innerHTML += displayResult.to_html()
    elif aggrid_df and str(type(displayResult)) == "<class 'pandas.core.frame.DataFrame'>":
        print("Rendering DataFrame Grid")
        json = displayResult.to_json(orient='records')
        js.render_griddf(output_div, json)
    else:
        print(f"Unknown display type {type(displayResult)}")
        print(displayResult)


display = _display

try:
    import matplotlib
    #from matplotlib_pyodide import browser_backend 
    matplotlib.use("module://matplotlib_pyodide.wasm_backend")
    from js import document

    document.pyodideMplTarget = document.getElementById('bottom')
    
    #browser_backend.interactive=False
    # patch to use a separate div
    #old_show = browser_backend.FigureCanvasWasm.show
    #def show(self):
    #    result = old_show(self)
    #    self._id = self._id + "1"

    #browser_backend.FigureCanvasWasm.show = show

except Exception as e:
    console.log("Couldn't register matplotlib target")
`);
}


async function displayPyProxy(result) {
    globalThis.displayResult = result
    let result2 = await globalThis.pyodide.runPython(`
    import js
    _display(js.displayResult)
    `);
}


async function runCode() {

    let autoPrint = true;
    try {
        
        if (globalThis.pyodide) {

            const pythonCode = globalThis.editor.getValue();
            console.log("Running code, length: ", pythonCode.length);
            const autoimport = true;
            pyStdOut("loadPackagesFromImports: Started")
            if (autoimport) {
                globalThis.pyodide.loadPackagesFromImports(pythonCode);

            }
            pyStdOut("Execution: Started")
            let result = await globalThis.pyodide.runPythonAsync(pythonCode); // async allows top level await
            pyStdOut("Execution: Complete")


            if (autoPrint){
                if (result === null){
                    return;
                }
                else if (result instanceof globalThis.pyodide.ffi.PyProxy) {
                    displayPyProxy(result);
                }
                else {
                    pyStdOut(result);
                }
            }

        }
    } catch (error) {
        console.error("An error occurred while running Python code:", error);
        pyStdErr(error)
    }
}


function clearOutput() {
    document.getElementById("bottom").innerHTML = "";
}


export async function registerOnloads(){

    document.getElementById("runBtn").addEventListener("click", runCode);
    document.getElementById("clearBtn").addEventListener("click", clearOutput);
    document.getElementById("loadBtn").addEventListener("click", loadPyodideAndPackages);

    
    queryEditor.addEventListener("keydown", function (event) {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            runCode();
        }
    });
}

