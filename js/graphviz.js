let hpccWasm = window["@hpcc-js/wasm"];
let gv = hpccWasm.Graphviz

export async function drawGraphviz(dot){
    const parentDiv = document.getElementById("bottom");
    let childDiv = document.createElement('div');
    parentDiv.appendChild(childDiv);
     
    gv.load().then(graphviz => {
        childDiv.innerHTML = graphviz.layout(dotGraph, "svg", "dot");
    });
}