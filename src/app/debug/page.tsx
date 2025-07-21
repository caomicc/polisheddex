import { loadDexOrders } from '@/utils/pokemonNavigation';
import { loadJsonFile } from '@/utils/fileLoader';

export default async function DebugPage() {
  try {
    // Test file loading
    const dexOrders = await loadDexOrders();

    // Try loading a sample pokemon file
    const samplePokemon = await loadJsonFile('output/pokemon/pikachu.json');

    return (
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Debug Information</h1>

        <div className="grid gap-6">
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">Environment Info</h2>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-auto">
              {JSON.stringify({
                cwd: process.cwd(),
                nodeEnv: process.env.NODE_ENV,
                vercelEnv: process.env.VERCEL_ENV,
              }, null, 2)}
            </pre>
          </div>

          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">Dex Orders Status</h2>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-auto">
              {JSON.stringify({
                nationalCount: dexOrders.national.length,
                johtoCount: dexOrders.johto.length,
                nationalSample: dexOrders.national.slice(0, 5),
                johtoSample: dexOrders.johto.slice(0, 5)
              }, null, 2)}
            </pre>
          </div>

          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">Sample Pokemon File</h2>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-auto">
              {samplePokemon ? 'Pokemon file loaded successfully' : 'Failed to load pokemon file'}
            </pre>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Debug Error</h1>
        <pre className="bg-red-50 dark:bg-red-900 p-4 rounded text-sm overflow-auto">
          {error instanceof Error ? error.message : String(error)}
        </pre>
      </div>
    );
  }
}
