import { DEFAULT_MODEL_OPTION } from './shared.js';
import type { RuntimeAgentDef } from '../types.js';

function buildInlineScript(model: string): string {
  const safeModel = model.replace(/'/g, "\\'");
  return [
    `const u=process.env.NVIDIA_NIM_BASE_URL||'https://integrate.api.nvidia.com/v1';`,
    `const k=process.env.NVIDIA_NIM_API_KEY||'';`,
    `const m='${safeModel}';`,
    `const b=[];`,
    `process.stdin.on('data',d=>b.push(d));`,
    `process.stdin.on('end',async()=>{`,
    `  const p=Buffer.concat(b).toString();`,
    `  try{`,
    `    const r=await fetch(u+'/chat/completions',{`,
    `      method:'POST',`,
    `      headers:{'Content-Type':'application/json','Authorization':'Bearer '+k},`,
    `      body:JSON.stringify({model:m,messages:[{role:'user',content:p}]}),`,
    `    });`,
    `    if(!r.ok){process.stderr.write('NIM error:'+r.status);process.exit(1);}`,
    `    const j=await r.json();`,
    `    process.stdout.write(j.choices?.[0]?.message?.content||'');`,
    `  }catch(e){process.stderr.write('NIM error:'+e.message);process.exit(1);}`,
    `});`,
  ].join('');
}

export const nvidiaNimDef = {
    id: 'nvidia-nim',
    name: 'NVIDIA NIM',
    // Uses Node.js to run an inline script that calls the NVIDIA NIM API
    // via its OpenAI-compatible endpoint. No local CLI binary needed.
    bin: 'node',
    versionArgs: ['--version'],
    fallbackModels: [
      DEFAULT_MODEL_OPTION,
      { id: 'meta/llama-3.1-405b-instruct', label: 'Llama 3.1 405B' },
      { id: 'meta/llama-3.1-70b-instruct', label: 'Llama 3.1 70B' },
      { id: 'meta/llama-3.1-8b-instruct', label: 'Llama 3.1 8B' },
      { id: 'nvidia/llama-3.1-nemotron-70b-instruct', label: 'Nemotron 70B' },
      { id: 'mistralai/mistral-7b-instruct-v0.3', label: 'Mistral 7B' },
    ],
    buildArgs: (_prompt, _imagePaths, _extra, options = {}) => {
      const model = options.model && options.model !== 'default'
        ? options.model
        : 'meta/llama-3.1-405b-instruct';
      return ['-e', buildInlineScript(model)];
    },
    promptViaStdin: true,
    streamFormat: 'plain',
    env: {
      NODE_OPTIONS: '--no-warnings',
    },
} satisfies RuntimeAgentDef;
