import { GoogleGenAI, Type } from '@google/genai';
import { Agent, AgentPersona, SyllabusItem } from '../store/useSocialStore';
import { ScenarioDef } from '../types/engine';
import { useSettingsStore } from '../store/useSettingsStore';
import { JourneyData } from '../store/useJourneyStore';

const JOURNEY_SETUP_PROMPT = `Anda adalah AI Educator untuk "Visualisasi Proses".
Tugas Anda adalah membuat skenario visualisasi langkah-demi-langkah dari sebuah proses (misal: Spermatogenesis, Siklus Air, Sejarah Perang, Algoritma).
Grid simulasi berukuran 50x20.

ATURAN GROUNDING (SANGAT PENTING):
1. Jika ada [MATERI REFERENSI UTAMA], Anda WAJIB menggunakan data tersebut sebagai satu-satunya sumber kebenaran.
2. JANGAN menambahkan informasi di luar materi referensi jika materi tersebut sudah cukup detail.
3. Jika materi referensi kurang lengkap, Anda boleh melengkapi dengan pengetahuan umum yang AKURAT, namun tetap prioritaskan struktur dari materi referensi.
4. JANGAN NGAWUR atau berhalusinasi. Semua langkah harus logis dan sesuai fakta ilmiah/sejarah.

Aturan Teknis:
1. zones: Buat 2-5 zona (area) vertikal atau horizontal yang terstruktur seperti peta sungguhan. Misal untuk Spermatogenesis: Testis (x:0-15), Epididimis (x:16-30), Vas Deferens (x:31-49).
2. actors: Buat entitas yang terlibat (misal: Spermatogonium, Sperma Dewasa, Sel Sertoli). Beri 1 huruf ASCII dan warna Tailwind.
3. scenes: Buat 10-30 adegan (langkah) yang mencakup SELURUH materi secara detail.
   - JANGAN menyingkat proses. Pecah materi menjadi langkah-langkah visual kecil.
   - Pastikan alur cerita lengkap dari awal sampai akhir sesuai materi yang diberikan.
   - Tiap adegan punya posisi (x,y) untuk tiap aktor yang aktif.
   - PENTING: Pergerakan aktor antar adegan HARUS BERKESINAMBUNGAN (bergeser 1-5 kotak saja). JANGAN biarkan aktor teleportasi secara acak ke ujung peta.
   - x antara 0-49, y antara 0-19.
   - dialogue: opsional, apa yang dikatakan aktor di adegan itu.

KEMBALIKAN HANYA FORMAT JSON VALID. JANGAN GUNAKAN MARKDOWN \`\`\`json.
Struktur JSON:
{
  "title": "Judul Proses",
  "description": "Deskripsi singkat",
  "zones": [
    { "id": "z1", "name": "Testis", "bounds": {"x":0,"y":0,"w":16,"h":20}, "color": "bg-red-950/30" }
  ],
  "actors": [
    { "id": "a1", "name": "Sperma", "char": "S", "color": "text-white" }
  ],
  "scenes": [
    {
      "id": 1,
      "title": "Mitosis",
      "description": "Spermatogonium membelah...",
      "positions": [
        { "actorId": "a1", "x": 5, "y": 10 }
      ],
      "dialogue": [
        { "actorId": "a1", "text": "Aku membelah!" }
      ]
    }
  ]
}`;

export async function handleJourneyIntervention(userText: string, journey: JourneyData, currentSceneIndex: number) {
  const { getGeminiKey, getGroqKey, worldBuilderProvider, worldBuilderModel } = useSettingsStore.getState();
  const geminiKey = getGeminiKey();
  const groqKey = getGroqKey();
  
  const currentScene = journey.scenes[currentSceneIndex];
  
  const prompt = `Anda adalah AI Educator untuk "Visualisasi Proses".
Pemain baru saja memberikan intervensi/pertanyaan di tengah simulasi: "${userText}"

Skenario saat ini: ${journey.title}
Adegan saat ini (Index ${currentSceneIndex}): ${currentScene.title} - ${currentScene.description}

Tugas Anda: Buat SATU adegan baru (scene) yang merespons intervensi pemain ini, melanjutkan dari posisi aktor di adegan saat ini.
Aktor yang tersedia: ${journey.actors.map(a => a.id).join(', ')}
Posisi aktor saat ini: ${JSON.stringify(currentScene.positions)}

KEMBALIKAN HANYA FORMAT JSON VALID.
Struktur JSON:
{
  "id": ${journey.scenes.length + 1},
  "title": "Judul Adegan Baru",
  "description": "Deskripsi respons terhadap intervensi",
  "positions": [
    { "actorId": "a1", "x": 10, "y": 10 }
  ],
  "dialogue": [
    { "actorId": "a1", "text": "Respons dialog!" }
  ]
}`;

  if (worldBuilderProvider === 'groq') {
    if (!groqKey) throw new Error("Tidak ada koneksi ke dewa.");
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: worldBuilderModel,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      })
    });
    if (!res.ok) throw new Error("Gagal memproses intervensi.");
    const data = await res.json();
    return JSON.parse(data.choices[0].message.content);
  } else {
    const key = geminiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!key) throw new Error("Tidak ada koneksi ke dewa.");
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model: worldBuilderModel || 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.NUMBER },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            positions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  actorId: { type: Type.STRING },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER }
                },
                required: ["actorId", "x", "y"]
              }
            },
            dialogue: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  actorId: { type: Type.STRING },
                  text: { type: Type.STRING }
                },
                required: ["actorId", "text"]
              }
            }
          },
          required: ["id", "title", "description", "positions"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  }
}

export async function generateJourney(inputText: string, uploadedFile: { data: string; mimeType: string } | null): Promise<JourneyData> {
  const { getGeminiKey, getGroqKey, worldBuilderProvider, worldBuilderModel } = useSettingsStore.getState();
  const geminiKey = getGeminiKey();
  const groqKey = getGroqKey();
  
  let fileContent = '';
  if (uploadedFile && uploadedFile.mimeType.includes('text')) {
    try {
      fileContent = atob(uploadedFile.data);
    } catch (e) {
      console.error("Failed to decode file", e);
    }
  }

  const userPrompt = `Topik/Proses yang diminta: "${inputText}"
${fileContent ? `\n[MATERI REFERENSI UTAMA]\n${fileContent}\n\nInstruksi: Gunakan materi referensi di atas sebagai sumber utama. Jangan ada yang terlewat.` : ''}`;

  if (worldBuilderProvider === 'groq') {
    if (!groqKey) throw new Error('Groq API Key is missing.');
    
    // Warning for PDF with Groq
    if (uploadedFile && uploadedFile.mimeType === 'application/pdf') {
      console.warn("Groq does not support PDF parsing directly. Content might be missing.");
      // Ideally we should notify the user, but for now we proceed with just the text prompt
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: worldBuilderModel,
        messages: [{ role: 'system', content: JOURNEY_SETUP_PROMPT }, { role: 'user', content: userPrompt }],
        response_format: { type: "json_object" }
      })
    });
    if (!res.ok) throw new Error('Failed to fetch from Groq');
    const data = await res.json();
    let jsonStr = data.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } else {
    const key = geminiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!key) throw new Error('Gemini API Key is missing.');
    const ai = new GoogleGenAI({ apiKey: key });
    const parts: any[] = [];
    if (uploadedFile) parts.push({ inlineData: { data: uploadedFile.data, mimeType: uploadedFile.mimeType } });
    parts.push({ text: JOURNEY_SETUP_PROMPT + '\n\n' + userPrompt });

    const response = await ai.models.generateContent({
      model: worldBuilderModel || 'gemini-3.1-pro-preview',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            zones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  bounds: {
                    type: Type.OBJECT,
                    properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, w: { type: Type.NUMBER }, h: { type: Type.NUMBER } },
                    required: ["x", "y", "w", "h"]
                  },
                  color: { type: Type.STRING }
                },
                required: ["id", "name", "bounds", "color"]
              }
            },
            actors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  char: { type: Type.STRING },
                  color: { type: Type.STRING }
                },
                required: ["id", "name", "char", "color"]
              }
            },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.NUMBER },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  positions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        actorId: { type: Type.STRING },
                        x: { type: Type.NUMBER },
                        y: { type: Type.NUMBER }
                      },
                      required: ["actorId", "x", "y"]
                    }
                  },
                  dialogue: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        actorId: { type: Type.STRING },
                        text: { type: Type.STRING }
                      },
                      required: ["actorId", "text"]
                    }
                  }
                },
                required: ["id", "title", "description", "positions"]
              }
            }
          },
          required: ["title", "description", "zones", "actors", "scenes"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  }
}

const SOCIAL_SETUP_PROMPT = `Anda adalah AI Produser Podcast Edukasi.
Tugas Anda adalah membaca materi yang diberikan (bisa berupa teks panjang atau slide presentasi) dan mengekstraknya menjadi "Daftar Poin Atomik" (Atomic Facts) yang sangat detail untuk dibahas di podcast.

ATURAN GROUNDING (SANGAT PENTING):
1. Jika ada [MATERI REFERENSI UTAMA], Anda WAJIB menggunakan data tersebut sebagai sumber utama.
2. JANGAN NGAWUR. Semua poin atomik harus benar-benar ada di dalam materi atau merupakan kesimpulan logis yang akurat dari materi tersebut.
3. Pecah materi menjadi 5-8 poin atomik yang sangat spesifik, mendalam, dan berurutan secara logis (dari dasar ke kompleks). Setiap poin harus mengandung informasi yang cukup untuk didiskusikan.

Lalu, buat TEPAT 2 Karakter (Host dan Co-Host/Tamu) yang akan membahas materi ini dalam format podcast.
Berikan mereka nama dan persona yang saling melengkapi dengan dinamika "Expert vs Refiner":
1. Karakter 1 (The Expert/Source): Memegang data/materi. Tugasnya menjelaskan konsep secara akurat berdasarkan data.
2. Karakter 2 (The Refiner/Curious Mind): Bertugas "menyempurnakan" data. Dia tidak hanya mengangguk, tapi selalu bertanya "kenapa?", meminta klarifikasi, atau mencoba menyimpulkan ulang (refining) penjelasan Karakter 1 agar lebih mudah dipahami pendengar.

KEMBALIKAN HANYA FORMAT JSON VALID. JANGAN GUNAKAN MARKDOWN \`\`\`json.
Struktur JSON:
{
  "topic": "Judul Singkat Materi",
  "facts": ["Poin Atomik 1 (Sangat detail dan spesifik)", "Poin Atomik 2", "Poin Atomik 3..."],
  "agents": [
    {
      "id": "a1",
      "name": "Nama Karakter 1",
      "persona": "Expert yang tenang, berwawasan luas, dan fokus pada akurasi data. Suka menjelaskan dengan detail.",
      "char": "E",
      "color": "text-blue-400"
    },
    {
      "id": "a2",
      "name": "Nama Karakter 2",
      "persona": "Refiner yang kritis, mewakili pendengar cerdas. Suka memotong untuk memastikan pemahaman, meminta analogi, atau menyimpulkan inti pembicaraan.",
      "char": "R",
      "color": "text-green-400"
    }
  ]
}`;

export async function generateStudyMaterial(inputText: string, uploadedFile: { data: string; mimeType: string } | null) {
  const { getGeminiKey, getGroqKey, worldBuilderProvider, worldBuilderModel } = useSettingsStore.getState();
  const geminiKey = getGeminiKey();
  const groqKey = getGroqKey();
  
  let fileContent = '';
  if (uploadedFile && uploadedFile.mimeType.includes('text')) {
    try {
      fileContent = atob(uploadedFile.data);
    } catch (e) {
      console.error("Failed to decode file", e);
    }
  }

  const userPrompt = `Materi: "${inputText}"
${fileContent ? `\n[MATERI REFERENSI UTAMA]\n${fileContent}\n\nInstruksi: Gunakan materi referensi di atas sebagai sumber utama.` : ''}`;

  if (worldBuilderProvider === 'groq') {
    if (!groqKey) throw new Error('Groq API Key is missing.');
    
    // Warning for PDF with Groq
    if (uploadedFile && uploadedFile.mimeType === 'application/pdf') {
       console.warn("Groq does not support PDF parsing directly. Content might be missing.");
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: worldBuilderModel,
        messages: [{ role: 'system', content: SOCIAL_SETUP_PROMPT }, { role: 'user', content: userPrompt }],
        response_format: { type: "json_object" }
      })
    });
    if (!res.ok) throw new Error('Failed to fetch from Groq');
    const data = await res.json();
    let jsonStr = data.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } else {
    const key = geminiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!key) throw new Error('Gemini API Key is missing.');
    const ai = new GoogleGenAI({ apiKey: key });
    const parts: any[] = [];
    if (uploadedFile) parts.push({ inlineData: { data: uploadedFile.data, mimeType: uploadedFile.mimeType } });
    parts.push({ text: SOCIAL_SETUP_PROMPT + '\n\n' + userPrompt });

    const response = await ai.models.generateContent({
      model: worldBuilderModel || 'gemini-3.1-pro-preview',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            facts: { type: Type.ARRAY, items: { type: Type.STRING } },
            agents: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  persona: { type: Type.STRING },
                  char: { type: Type.STRING },
                  color: { type: Type.STRING }
                },
                required: ["id", "name", "persona", "char", "color"]
              }
            }
          },
          required: ["topic", "facts", "agents"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  }
}

export async function generateAgentThought(agent: Agent, fact: string, topic: string) {
  const { getGeminiKey, getGroqKey, worldBuilderProvider, worldBuilderModel } = useSettingsStore.getState();
  const geminiKey = getGeminiKey();
  const groqKey = getGroqKey();
  const prompt = `Kamu adalah ${agent.name}, seorang podcaster edukasi.
Gaya bicaramu: ${agent.persona}. (Gunakan ini HANYA sebagai gaya bahasa, BUKAN fokus utama).

Topik podcast saat ini: "${topic}".
Kamu baru saja membaca poin materi ini: "${fact}"

Tugas:
1. Tulis SATU kalimat singkat (maksimal 15 kata) tentang apa yang sedang kamu pikirkan atau pelajari dari poin tersebut, seolah sedang bersiap untuk membahasnya di mic.
2. Buat visualisasi slide singkat untuk poin ini.

Aturan Wajib:
1. Fokus pada MATERI BELAJAR.
2. DILARANG KERAS membahas hal di luar topik "${topic}".
3. Gunakan bahasa Indonesia yang santai tapi edukatif.

KEMBALIKAN HANYA FORMAT JSON VALID. JANGAN GUNAKAN MARKDOWN \`\`\`json.
{
  "thought": "Kalimat pikiranmu",
  "slide": {
    "title": "Judul Slide (3-5 kata)",
    "content": ["Poin 1", "Poin 2"],
    "type": "concept" // Pilih satu: 'concept', 'challenge', 'solution', 'implementation'
  }
}`;

  if (worldBuilderProvider === 'groq') {
    if (!groqKey) return { thought: "Hmm, menarik...", slide: null };
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: worldBuilderModel,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      })
    });
    if (!res.ok) return { thought: "Hmm...", slide: null };
    const data = await res.json();
    return JSON.parse(data.choices[0].message.content);
  } else {
    const key = geminiKey;
    if (!key) return { thought: "Hmm...", slide: null };
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model: worldBuilderModel || 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            thought: { type: Type.STRING },
            slide: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.ARRAY, items: { type: Type.STRING } },
                type: { type: Type.STRING, enum: ['concept', 'challenge', 'solution', 'implementation'] }
              },
              required: ["title", "content", "type"]
            }
          },
          required: ["thought", "slide"]
        }
      }
    });
    return JSON.parse(response.text || '{"thought": "Hmm...", "slide": null}');
  }
}

export async function generateAgentReactionToUser(agent: Agent, userMessage: string, topic: string) {
  const { getGeminiKey, getGroqKey, worldBuilderProvider, worldBuilderModel } = useSettingsStore.getState();
  const geminiKey = getGeminiKey();
  const groqKey = getGroqKey();
  const prompt = `Kamu adalah ${agent.name}, seorang podcaster edukasi.
Gaya bicaramu: ${agent.persona}. (Gunakan ini HANYA sebagai gaya bahasa).

Topik podcast saat ini: "${topic}".
Pendengar (User) baru saja bertanya/berkomentar secara live: "${userMessage}"

Aturan Wajib:
1. Jawab atau tanggapi pesan Pendengar secara LANGSUNG dan INFORMATIF.
2. Jika Pendengar meminta penjelasan dasar, jelaskan konsep dasarnya. Jika mengajak brainstorm, berikan ide/tantangan/solusi.
3. Maksimal 2 kalimat singkat.
4. Gunakan bahasa Indonesia yang santai tapi edukatif (seperti podcaster ke pendengarnya).
5. DILARANG KERAS membahas hal di luar topik "${topic}".
6. Jika pesan Pendengar melenceng dari topik, arahkan mereka kembali ke pembahasan.

Apa tanggapanmu kepada Pendengar? (Langsung tulis ucapanmu tanpa tanda kutip)`;

  if (worldBuilderProvider === 'groq') {
    if (!groqKey) return "Hmm, menarik...";
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: worldBuilderModel,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!res.ok) return "Hmm...";
    const data = await res.json();
    return data.choices[0].message.content.trim();
  } else {
    const key = geminiKey;
    if (!key) return "Hmm...";
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model: worldBuilderModel || 'gemini-3.1-pro-preview',
      contents: prompt
    });
    return response.text?.trim() || "Hmm...";
  }
}

export async function generateAgentDialogue(agentA: Agent, agentB: Agent, topic: string, recentChats: string, learningPhase: string = 'C1') {
  const { getGeminiKey, getGroqKey, worldBuilderProvider, worldBuilderModel } = useSettingsStore.getState();
  const geminiKey = getGeminiKey();
  const groqKey = getGroqKey();
  
  let phaseInstruction = '';
  if (learningPhase === 'C1') {
    phaseInstruction = 'Ketukan 1 (The Hook & Intro): Karakter 1 (Expert) memperkenalkan konsep utama dari data. Karakter 2 (Refiner) langsung menanggapi dengan pertanyaan kritis atau meminta klarifikasi awal ("Kenapa itu penting?").';
  } else if (learningPhase === 'C2') {
    phaseInstruction = 'Ketukan 2 (Deep Dive & Refine): Karakter 1 (Expert) menjelaskan detail teknis. Karakter 2 (Refiner) HARUS mencoba menyederhanakan penjelasan tersebut dengan analogi atau ringkasan ("Jadi maksudnya seperti X?"), lalu Karakter 1 mengonfirmasi atau mengoreksi.';
  } else if (learningPhase === 'Brainstorm') {
    phaseInstruction = 'Ketukan 3 (Challenge & Application): Karakter 2 (Refiner) menantang konsep tersebut dengan skenario "What-If" atau kasus nyata. Karakter 1 (Expert) memberikan jawaban berbasis data.';
  } else if (learningPhase === 'Solution') {
    phaseInstruction = 'Ketukan 4 (The Perfect Takeaway): Karakter 2 (Refiner) merangkum poin penting menjadi satu kalimat "Golden Nugget". Karakter 1 (Expert) menyetujui dan menutup segmen ini.';
  }

  const prompt = `Buat dialog 2 baris antara dua podcaster edukasi yang sedang membahas topik "${topic}".
Fase Diskusi Saat Ini: ${learningPhase}.
INSTRUKSI FASE: ${phaseInstruction}

Riwayat Obrolan Terakhir:
${recentChats}

Karakter 1: ${agentA.name} (Peran: Expert/Source). Memegang Data: ${agentA.memory[agentA.memory.length - 1] || 'Belum membaca materi'}.
Karakter 2: ${agentB.name} (Peran: Refiner/Learner). Tugas: Memastikan data tersampaikan dengan sempurna.

Tujuan Diskusi:
Membahas materi sesuai dengan Instruksi Fase di atas. JANGAN KELUAR DARI TOPIK.

Aturan Interaksi (SANGAT PENTING):
1. DINAMIKA: Karakter 1 menjelaskan data. Karakter 2 TIDAK BOLEH hanya setuju. Karakter 2 HARUS "Refine" (memperjelas, menyederhanakan, atau menantang) penjelasan Karakter 1.
2. KOHERENSI MUTLAK: Teks Karakter 2 (dialogueB) HARUS merupakan respons langsung terhadap Teks Karakter 1 (dialogueA).
3. GAYA BAHASA: Gunakan bahasa lisan yang natural, bukan bahasa tulisan. Boleh memotong kalimat, menggunakan interjeksi (Nah, Wait, Jadi gini...), dan humor tipis.
4. EMERGENCE: Jangan kaku. Jika Karakter 1 terlalu teknis, Karakter 2 boleh protes ("Bentar bro, itu bahasa alien. Manusiawinya gimana?").
5. Panjang: Masing-masing 1-2 kalimat padat.

VISUALISASI (SLIDE):
Buat juga konten untuk "Slide Presentasi" yang merangkum inti dari pertukaran dialog ini.
- Title: Judul singkat (3-5 kata) yang nendang.
- Content: 2-3 poin bullet yang sangat ringkas.
- Type: Pilih satu dari ['concept', 'challenge', 'solution', 'implementation'].
  - 'concept': Jika membahas ide dasar/brainstorming.
  - 'challenge': Jika membahas masalah/hambatan.
  - 'solution': Jika membahas cara mengatasi masalah.
  - 'implementation': Jika membahas penerapan nyata.

KEMBALIKAN HANYA FORMAT JSON VALID. JANGAN GUNAKAN MARKDOWN \`\`\`json.
{
  "dialogueA": "Teks Karakter 1 (Expert menjelaskan)",
  "dialogueB": "Teks Karakter 2 (Refiner merespons/memperjelas)",
  "slide": {
    "title": "JUDUL SLIDE",
    "content": ["Poin 1", "Poin 2"],
    "type": "concept"
  }
}`;

  if (worldBuilderProvider === 'groq') {
    if (!groqKey) return { dialogueA: "Hei!", dialogueB: "Apa?", slide: null };
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: worldBuilderModel,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      })
    });
    if (!res.ok) return { dialogueA: "Hei!", dialogueB: "Apa?", slide: null };
    const data = await res.json();
    return JSON.parse(data.choices[0].message.content);
  } else {
    const key = geminiKey;
    if (!key) return { dialogueA: "Hei!", dialogueB: "Apa?", slide: null };
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model: worldBuilderModel || 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dialogueA: { type: Type.STRING },
            dialogueB: { type: Type.STRING },
            slide: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.ARRAY, items: { type: Type.STRING } },
                type: { type: Type.STRING, enum: ['concept', 'challenge', 'solution', 'implementation'] }
              },
              required: ["title", "content", "type"]
            }
          },
          required: ["dialogueA", "dialogueB", "slide"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  }
}

export async function generateAgentExplanation(teacher: Agent, learner: Agent, fact: string, topic: string, recentChats: string) {
  const { getGeminiKey, getGroqKey, worldBuilderProvider, worldBuilderModel } = useSettingsStore.getState();
  const geminiKey = getGeminiKey();
  const groqKey = getGroqKey();
  const prompt = `Buat dialog 2 baris di mana satu podcaster menjelaskan materi ke podcaster lain/pendengar.

Topik: "${topic}"
Poin yang dijelaskan: "${fact}"

Podcaster 1 (Menjelaskan): ${teacher.name} (Gaya bicara: ${teacher.persona}).
Podcaster 2 (Merespons): ${learner.name} (Gaya bicara: ${learner.persona}).

Aturan Wajib:
1. Podcaster 1 menjelaskan poin tersebut dengan bahasa yang mudah dimengerti (maks 2 kalimat).
2. Podcaster 2 merespons dengan pemahaman baru, pertanyaan lanjutan, atau analogi (maks 2 kalimat).
3. Fokus pada MATERI BELAJAR. DILARANG KERAS membahas hal di luar topik.

KEMBALIKAN HANYA FORMAT JSON VALID. JANGAN GUNAKAN MARKDOWN \`\`\`json.
{
  "dialogueTeacher": "Teks Podcaster 1",
  "dialogueLearner": "Teks Podcaster 2"
}`;

  if (worldBuilderProvider === 'groq') {
    if (!groqKey) return { dialogueTeacher: "Ini materinya.", dialogueLearner: "Oh gitu." };
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: worldBuilderModel,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      })
    });
    if (!res.ok) return { dialogueTeacher: "Ini materinya.", dialogueLearner: "Oh gitu." };
    const data = await res.json();
    return JSON.parse(data.choices[0].message.content);
  } else {
    const key = geminiKey;
    if (!key) return { dialogueTeacher: "Ini materinya.", dialogueLearner: "Oh gitu." };
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model: worldBuilderModel || 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dialogueTeacher: { type: Type.STRING },
            dialogueLearner: { type: Type.STRING }
          },
          required: ["dialogueTeacher", "dialogueLearner"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  }
}

export async function generateAgentBrainstorm(agentA: Agent, agentB: Agent, fact: string, topic: string, recentChats: string) {
  const { getGeminiKey, getGroqKey, worldBuilderProvider, worldBuilderModel } = useSettingsStore.getState();
  const geminiKey = getGeminiKey();
  const groqKey = getGroqKey();
  const prompt = `Buat dialog 2 baris antara dua podcaster edukasi yang sedang melakukan BRAINSTORMING tentang materi.

Topik: "${topic}"
Poin yang dibahas: "${fact}"

Podcaster 1: ${agentA.name} (Gaya bicara: ${agentA.persona}).
Podcaster 2: ${agentB.name} (Gaya bicara: ${agentB.persona}).

Tujuan Brainstorming:
Membahas TANTANGAN, SOLUSI, atau IMPLEMENTASI NYATA dari poin tersebut.
Misal: "Kalau proses ini gagal, apa dampaknya?" -> "Dampaknya X, solusinya mungkin Y."

Aturan Wajib:
1. Podcaster 1 melempar ide, tantangan, atau skenario "bagaimana jika" (maks 2 kalimat).
2. Podcaster 2 merespons dengan solusi, implementasi, atau ide lanjutan (maks 2 kalimat).
3. Fokus pada MATERI BELAJAR. DILARANG KERAS membahas hal di luar topik.

KEMBALIKAN HANYA FORMAT JSON VALID. JANGAN GUNAKAN MARKDOWN \`\`\`json.
{
  "dialogueA": "Teks Podcaster 1",
  "dialogueB": "Teks Podcaster 2"
}`;

  if (worldBuilderProvider === 'groq') {
    if (!groqKey) return { dialogueA: "Tantangannya apa?", dialogueB: "Solusinya ini." };
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: worldBuilderModel,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      })
    });
    if (!res.ok) return { dialogueA: "Tantangannya apa?", dialogueB: "Solusinya ini." };
    const data = await res.json();
    return JSON.parse(data.choices[0].message.content);
  } else {
    const key = geminiKey;
    if (!key) return { dialogueA: "Tantangannya apa?", dialogueB: "Solusinya ini." };
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model: worldBuilderModel || 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dialogueA: { type: Type.STRING },
            dialogueB: { type: Type.STRING }
          },
          required: ["dialogueA", "dialogueB"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  }
}

const SYSTEM_PROMPT = `Anda adalah AI Game Engine Architect.
Ubah teks/dokumen yang diberikan menjadi aturan simulasi Cellular Automata (ASCII Sandbox).
Simulasi harus terasa seperti ekosistem yang hidup atau reaksi berantai yang logis.

ATURAN GROUNDING (SANGAT PENTING):
1. Gunakan materi yang diberikan sebagai basis logika simulasi.
2. JANGAN NGAWUR. Jika materi membahas tentang "Sel Darah", maka entitas dan interaksinya harus mencerminkan biologi sel darah, bukan hal lain.
3. Jika materi tidak memberikan detail interaksi, buatlah interaksi yang masuk akal secara ilmiah berdasarkan entitas yang ada.

Aturan Pembuatan:
1. ENTITIES: Buat 4-6 entitas. Tentukan karakter ASCII (1 huruf/simbol) dan warna Tailwind (misal: text-blue-400, text-red-500, text-green-400, text-zinc-500, text-yellow-400, text-purple-500). 
   - WAJIB isi 'description' dengan penjelasan ilmiah/edukatif singkat tentang entitas ini.
   - Movement bisa 'static', 'wander', 'seek' (mendekati targetEntity), atau 'flee' (menjauhi targetEntity).
   - Buatlah agar entitas memiliki perilaku yang logis (habitat/terarah). Jangan semuanya 'wander' secara acak. Gunakan 'seek' dan 'flee' agar ada dinamika ekosistem yang jelas.
   - Jika 'seek' atau 'flee', WAJIB isi 'targetEntity' dengan id entitas lain.
   - Opsional: isi 'lifespan' (angka 5-50) untuk entitas sementara seperti ledakan/gas.
2. INTERACTIONS: Aturan sebab-akibat jika dua entitas bersebelahan. 
   - result1/result2 bisa berupa id entitas baru, 'none' (hancur), atau 'same' (tetap).
   - Opsional: isi 'spawnEntity' dengan id entitas ketiga yang akan muncul di kotak kosong terdekat akibat interaksi ini (misal: A + B menghasilkan C).
   - Tambahkan logMessage dramatis untuk interaksi penting.
3. SLIDERS: Buat 3 variabel lingkungan (0-100) yang memicu kemunculan entitas tertentu (spawnEntity).
4. TOOLS: Buat 3 "God Tools" untuk pemain berinteraksi langsung.
   - action: 'spawn' atau 'destroy'.
   - targetEntity: id entitas yang di-spawn/destroy.
   - radius: 0 (1 kotak), 1 (3x3 kotak), atau 2 (5x5 kotak).
5. PATHOLOGIES: Buat 2-3 "Event" atau kondisi medis/lingkungan yang terjadi jika kondisi tertentu terpenuhi.
   - triggerCondition: array kondisi.
     - type: 'entity_count' (jumlah entitas di grid) atau 'slider_value' (nilai slider 0-100).
     - targetId: id entitas atau id slider.
     - operator: '>', '<', '>='.
     - value: angka ambang batas.
   - logMessage: Pesan narator yang menarik/dramatis saat event terjadi.
   - logType: 'info', 'warning', 'critical'.
   - cooldown: jeda tick sebelum bisa trigger lagi (default 100).

KEMBALIKAN HANYA FORMAT JSON VALID. JANGAN GUNAKAN MARKDOWN \`\`\`json.
Struktur JSON yang diharapkan:
{
  "title": "string",
  "description": "string",
  "entities": [
    { "id": "string", "char": "string", "color": "string", "name": "string", "description": "string", "movement": "static|wander|seek|flee", "targetEntity": "string", "lifespan": 10 }
  ],
  "interactions": [
    { "entity1": "string", "entity2": "string", "result1": "string|none|same", "result2": "string|none|same", "spawnEntity": "string", "probability": 0.5, "logMessage": "string", "logType": "info|warning|critical" }
  ],
  "sliders": [
    { "id": "string", "name": "string", "desc": "string", "spawnEntity": "string" }
  ],
  "tools": [
    { "id": "string", "name": "string", "desc": "string", "action": "spawn|destroy", "targetEntity": "string", "radius": 1 }
  ],
  "pathologies": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "triggerCondition": [
        { "type": "entity_count|slider_value", "targetId": "string", "operator": ">|<|>=", "value": 10 }
      ],
      "logMessage": "string",
      "logType": "info|warning|critical",
      "cooldown": 100
    }
  ]
}`;

export async function handleSandboxIntervention(userText: string, scenario: ScenarioDef) {
  const { getGeminiKey, getGroqKey, worldBuilderProvider, worldBuilderModel } = useSettingsStore.getState();
  const geminiKey = getGeminiKey();
  const groqKey = getGroqKey();
  
  const prompt = `Anda adalah AI Game Master untuk simulasi Cellular Automata.
Pemain baru saja memberikan intervensi/perintah: "${userText}"

Skenario saat ini:
Judul: ${scenario.title}
Entitas yang tersedia: ${scenario.entities.map(e => e.id).join(', ')}

Tugas Anda: Terjemahkan perintah pemain menjadi aksi konkret di dalam grid simulasi.
Anda bisa men-spawn (memunculkan) atau men-destroy (menghancurkan) entitas tertentu di area tertentu.
Grid berukuran 50x20 (x: 0-49, y: 0-19).

KEMBALIKAN HANYA FORMAT JSON VALID.
Struktur JSON:
{
  "message": "Pesan balasan singkat bergaya Game Master (maks 15 kata)",
  "actions": [
    {
      "action": "spawn|destroy",
      "entityId": "id_entitas_yang_valid",
      "x": 25,
      "y": 10,
      "radius": 2
    }
  ]
}`;

  if (worldBuilderProvider === 'groq') {
    if (!groqKey) return { message: "Tidak ada koneksi ke dewa.", actions: [] };
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: worldBuilderModel,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      })
    });
    if (!res.ok) return { message: "Gagal memproses intervensi.", actions: [] };
    const data = await res.json();
    return JSON.parse(data.choices[0].message.content);
  } else {
    const key = geminiKey;
    if (!key) return { message: "Tidak ada koneksi ke dewa.", actions: [] };
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model: worldBuilderModel || 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING },
            actions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  action: { type: Type.STRING },
                  entityId: { type: Type.STRING },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  radius: { type: Type.NUMBER }
                },
                required: ["action", "entityId", "x", "y", "radius"]
              }
            }
          },
          required: ["message", "actions"]
        }
      }
    });
    return JSON.parse(response.text || '{"message": "Gagal memproses", "actions": []}');
  }
}

export async function generateSyllabus(topic: string) {
  const { geminiKey, groqKey, worldBuilderProvider, worldBuilderModel } = useSettingsStore.getState();
  const prompt = `Anda adalah Arsitek Kurikulum Pembelajaran.
Tugas Anda adalah merancang silabus pembelajaran yang terstruktur untuk topik: "${topic}".

Buatlah daftar 5-10 sub-topik (modul) yang berurutan secara logis dari dasar hingga mahir.
Setiap sub-topik harus memiliki judul yang menarik dan deskripsi singkat tentang apa yang akan dipelajari.

KEMBALIKAN HANYA FORMAT JSON VALID. JANGAN GUNAKAN MARKDOWN \`\`\`json.
Struktur JSON:
{
  "syllabus": [
    {
      "title": "Judul Sub-topik",
      "description": "Deskripsi singkat (1 kalimat)"
    }
  ]
}`;

  if (worldBuilderProvider === 'groq') {
    if (!groqKey) throw new Error('Groq API Key is missing.');
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: worldBuilderModel,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      })
    });
    if (!res.ok) throw new Error('Failed to fetch from Groq');
    const data = await res.json();
    return JSON.parse(data.choices[0].message.content);
  } else {
    const key = geminiKey;
    if (!key) throw new Error('Gemini API Key is missing.');
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model: worldBuilderModel || 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            syllabus: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["title", "description"]
              }
            }
          },
          required: ["syllabus"]
        }
      }
    });
    return JSON.parse(response.text || '{"syllabus": []}');
  }
}

export async function generateSlideFromSyllabus(itemTitle: string, itemDescription: string, topic: string) {
  const { geminiKey, groqKey, worldBuilderProvider, worldBuilderModel } = useSettingsStore.getState();
  const prompt = `Anda adalah Desainer Presentasi Edukasi.
Topik Utama: "${topic}"
Sub-topik saat ini: "${itemTitle}"
Deskripsi: "${itemDescription}"

Tugas: Buatlah konten slide presentasi yang visual dan informatif untuk sub-topik ini.
Pastikan kontennya padat, jelas, dan mudah dipahami.

KEMBALIKAN HANYA FORMAT JSON VALID. JANGAN GUNAKAN MARKDOWN \`\`\`json.
Struktur JSON:
{
  "title": "Judul Slide (Bisa sama dengan sub-topik atau lebih kreatif)",
  "content": ["Poin 1", "Poin 2", "Poin 3"],
  "type": "concept" // Pilih satu: 'concept', 'challenge', 'solution', 'implementation'
}`;

  if (worldBuilderProvider === 'groq') {
    if (!groqKey) return null;
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: worldBuilderModel,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return JSON.parse(data.choices[0].message.content);
  } else {
    const key = geminiKey;
    if (!key) return null;
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model: worldBuilderModel || 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.ARRAY, items: { type: Type.STRING } },
            type: { type: Type.STRING, enum: ['concept', 'challenge', 'solution', 'implementation'] }
          },
          required: ["title", "content", "type"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  }
}

export async function generateScenario(inputText: string, uploadedFile: { data: string; mimeType: string } | null): Promise<ScenarioDef> {
  const { geminiKey, groqKey, worldBuilderProvider, worldBuilderModel } = useSettingsStore.getState();

  const userPrompt = `Teks Input Tambahan (jika ada): "${inputText}"\n\n${uploadedFile && uploadedFile.mimeType.includes('text') ? 'Isi File: ' + atob(uploadedFile.data) : ''}`;

  if (worldBuilderProvider === 'groq') {
    if (!groqKey) throw new Error('Groq API Key is missing. Please configure it in Settings.');
    
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: worldBuilderModel,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to fetch from Groq');
    }

    const data = await res.json();
    let jsonStr = data.choices[0].message.content;
    
    // Sanitize markdown if Groq still returns it despite instructions
    jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr) as ScenarioDef;

  } else {
    // Gemini
    const key = geminiKey;
    if (!key) throw new Error('Gemini API Key is missing.');

    const ai = new GoogleGenAI({ apiKey: key });
    
    const parts: any[] = [];
    if (uploadedFile) {
      parts.push({ inlineData: { data: uploadedFile.data, mimeType: uploadedFile.mimeType } });
    }
    parts.push({ text: SYSTEM_PROMPT + '\n\n' + userPrompt });

    const response = await ai.models.generateContent({
      model: worldBuilderModel || 'gemini-3.1-pro-preview',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            entities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  char: { type: Type.STRING },
                  color: { type: Type.STRING },
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  movement: { type: Type.STRING },
                  targetEntity: { type: Type.STRING },
                  lifespan: { type: Type.NUMBER }
                },
                required: ["id", "char", "color", "name", "description", "movement"]
              }
            },
            interactions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  entity1: { type: Type.STRING },
                  entity2: { type: Type.STRING },
                  result1: { type: Type.STRING },
                  result2: { type: Type.STRING },
                  spawnEntity: { type: Type.STRING },
                  probability: { type: Type.NUMBER },
                  logMessage: { type: Type.STRING },
                  logType: { type: Type.STRING }
                },
                required: ["entity1", "entity2", "result1", "result2", "probability"]
              }
            },
            sliders: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  desc: { type: Type.STRING },
                  spawnEntity: { type: Type.STRING }
                },
                required: ["id", "name", "desc", "spawnEntity"]
              }
            },
            tools: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  desc: { type: Type.STRING },
                  action: { type: Type.STRING },
                  targetEntity: { type: Type.STRING },
                  radius: { type: Type.NUMBER }
                },
                required: ["id", "name", "desc", "action", "radius"]
              }
            },
            pathologies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  triggerCondition: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        type: { type: Type.STRING },
                        targetId: { type: Type.STRING },
                        operator: { type: Type.STRING },
                        value: { type: Type.NUMBER }
                      },
                      required: ["type", "targetId", "operator", "value"]
                    }
                  },
                  logMessage: { type: Type.STRING },
                  logType: { type: Type.STRING },
                  cooldown: { type: Type.NUMBER }
                },
                required: ["id", "name", "description", "triggerCondition", "logMessage"]
              }
            }
          },
          required: ["title", "description", "entities", "interactions", "sliders", "tools"]
        }
      }
    });

    return JSON.parse(response.text || '{}') as ScenarioDef;
  }
}

export async function editJourneyScene(journey: JourneyData, sceneIndex: number, instruction: string) {
  const { getGeminiKey, getGroqKey, worldBuilderProvider, worldBuilderModel } = useSettingsStore.getState();
  const geminiKey = getGeminiKey();
  const groqKey = getGroqKey();
  
  const scene = journey.scenes[sceneIndex];
  const prompt = `Anda adalah Asisten Editor untuk "Visualisasi Proses".
Tugas Anda adalah mengedit adegan (scene) yang ada berdasarkan instruksi pengguna.

Skenario: ${journey.title}
Adegan Saat Ini:
Judul: ${scene.title}
Deskripsi: ${scene.description}
Dialog: ${JSON.stringify(scene.dialogue)}

Instruksi Pengguna: "${instruction}"

KEMBALIKAN HANYA FORMAT JSON VALID untuk objek Scene yang diperbarui.
Struktur JSON:
{
  "title": "Judul Baru (jika berubah)",
  "description": "Deskripsi Baru (jika berubah)",
  "dialogue": [
    { "actorId": "a1", "text": "Dialog baru..." }
  ]
}`;

  if (worldBuilderProvider === 'groq') {
    if (!groqKey) throw new Error("Tidak ada koneksi ke dewa.");
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: worldBuilderModel,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      })
    });
    if (!res.ok) throw new Error("Gagal mengedit adegan.");
    const data = await res.json();
    return JSON.parse(data.choices[0].message.content);
  } else {
    const key = geminiKey;
    if (!key) throw new Error("Tidak ada koneksi ke dewa.");
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model: worldBuilderModel || 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            dialogue: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  actorId: { type: Type.STRING },
                  text: { type: Type.STRING }
                },
                required: ["actorId", "text"]
              }
            }
          },
          required: ["title", "description"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  }
}

export async function editSyllabusItem(item: SyllabusItem, instruction: string) {
  const { getGeminiKey, getGroqKey, worldBuilderProvider, worldBuilderModel } = useSettingsStore.getState();
  const geminiKey = getGeminiKey();
  const groqKey = getGroqKey();
  
  const prompt = `Anda adalah Asisten Editor Kurikulum.
Tugas Anda adalah mengedit item silabus berdasarkan instruksi pengguna.

Item Saat Ini:
Judul: ${item.title}
Deskripsi: ${item.description}

Instruksi Pengguna: "${instruction}"

KEMBALIKAN HANYA FORMAT JSON VALID.
Struktur JSON:
{
  "title": "Judul Baru",
  "description": "Deskripsi Baru"
}`;

  if (worldBuilderProvider === 'groq') {
    if (!groqKey) throw new Error("Tidak ada koneksi ke dewa.");
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: worldBuilderModel,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      })
    });
    if (!res.ok) throw new Error("Gagal mengedit item.");
    const data = await res.json();
    return JSON.parse(data.choices[0].message.content);
  } else {
    const key = geminiKey;
    if (!key) throw new Error("Tidak ada koneksi ke dewa.");
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model: worldBuilderModel || 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["title", "description"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  }
}
