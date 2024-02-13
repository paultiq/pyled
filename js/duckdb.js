
import * as duckdb from 'https://cdn.skypack.dev/@duckdb/duckdb-wasm@v1.28.0';

async function loadBlockingDuckDb () {
    console.log(window.location.origin);

    console.log("Initializing and connecting to a new db")
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

    const worker_url = URL.createObjectURL(
        new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
    );
    const worker = new Worker(worker_url);
    const logger = new duckdb.ConsoleLogger();

    let db = await duckdb.createDuckDB(JSDELIVR_BUNDLES, logger, duckdb.BROWSER_RUNTIME);
    await db.instantiate(_ => {});

    await db.open({
        path: ':memory:',
        query: {
            castBigIntToDouble: true,
            castDecimalToDouble: true
        },
        filesystem: {
            allowFullHTTPReads: true
        }
    });


    globalThis.duckDbCon = await db.connect();
    
    await registerDuckDbFunctions();
}

export async function loadAsyncDuckDb () {

    console.log(window.location.origin);

    console.log("Initializing and connecting to a new db")
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

    const worker_url = URL.createObjectURL(
        new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
    );
    const worker = new Worker(worker_url);
    const logger = new duckdb.ConsoleLogger();
    let db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    await db.open({
        path: ':memory:',
        query: {
            castBigIntToDouble: true,
            castDecimalToDouble: true
        },
    });
    globalThis.duckDbCon = await db.connect();

    await registerDuckDbFunctions()

}

export async function registerDuckDbFunctions() {
    try {
        let success = await globalThis.pyodide.runPythonAsync("")
        console.log("Query success", success)

        await globalThis.pyodide.runPython(`

class DuckDB():
    async def execute(self, query):
        import js
        import pandas
        r = await js.duckDbCon.query(query)
        a = r.toArray()
        data = [dict(v) for v in a.object_values()]
        df = pandas.DataFrame(data)
        print("Done executing")
        return df

duckdb = DuckDB()
            `);
    } catch (error) {
        console.error('An error occurred:', error);
    }
}
