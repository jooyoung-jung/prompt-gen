import { CreateMLCEngine } from "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@latest/+esm";

// Qwen3-0.6B 모델 설정
const MODEL_ID = "Qwen3-0.6B-q4f16_1-MLC";

const SYSTEM_PROMPT = `You are a professional AI image prompt engineer. Your role is to expand user keywords into detailed, creative, and visually descriptive image prompts in English. Focus on composition, lighting, style, mood, and artistic details. Output ONLY the Prompt and Negative Prompt in a clear format.`;

// DOM Elements
const generateBtn = document.getElementById('generate-btn');
const userInput = document.getElementById('user-input');
const outputPlaceholder = document.getElementById('output-placeholder');
const outputResult = document.getElementById('output-result');
const outputText = document.getElementById('output-text');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressPercent = document.getElementById('progress-percent');
const progressText = document.getElementById('progress-text');
const statusBadge = document.getElementById('status-badge');
const copyBtn = document.getElementById('copy-btn');

let engine = null;
let isModelLoaded = false;

// Update status badge
function updateStatus(text, color = 'amber') {
    const dot = statusBadge.querySelector('span:first-child');
    const label = statusBadge.querySelector('span:last-child');

    dot.className = `w-2 h-2 rounded-full bg-${color}-400`;
    if (color === 'green') {
        dot.classList.remove('animate-pulse');
    } else {
        dot.classList.add('animate-pulse');
    }
    label.textContent = text;
}

// Remove <think>...</think> tags from output
function removeThinkTags(text) {
    return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

// Particle Effect
function createParticles(x, y) {
    const particleCount = 15;
    const container = document.getElementById('particles');

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');

        const angle = Math.random() * Math.PI * 2;
        const velocity = 40 + Math.random() * 80;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;

        particle.style.width = Math.random() * 4 + 2 + 'px';
        particle.style.height = particle.style.width;
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);

        container.appendChild(particle);
        setTimeout(() => particle.remove(), 800);
    }
}

// Copy to clipboard
function copyToClipboard() {
    const text = outputText.innerText;
    navigator.clipboard.writeText(text).then(() => {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            복사됨!
        `;
        copyBtn.classList.add('text-green-400');
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.classList.remove('text-green-400');
        }, 2000);
    });
}

// Init Model
async function initModel() {
    if (isModelLoaded) return;

    progressContainer.classList.remove('hidden');
    progressText.innerText = "모델 초기화 중...";
    updateStatus('로딩 중', 'amber');

    const initProgressCallback = (report) => {
        console.log(report);
        const progress = report.progress;
        const pct = Math.round(progress * 100);
        progressBar.style.width = `${pct}%`;
        progressPercent.innerText = `${pct}%`;
        progressText.innerText = report.text;
    };

    try {
        engine = await CreateMLCEngine(MODEL_ID, { initProgressCallback });
        isModelLoaded = true;
        progressContainer.classList.add('hidden');
        updateStatus('준비 완료', 'green');
        console.log("Model Loaded!");
    } catch (error) {
        console.error("Model Load Failed:", error);
        progressText.innerText = "모델 로딩 실패";
        progressText.classList.add('text-red-400');
        updateStatus('오류', 'red');
    }
}

// Generate Handler
async function handleGenerate(e) {
    const rect = generateBtn.getBoundingClientRect();
    createParticles(rect.left + rect.width / 2, rect.top + rect.height / 2);

    const prompt = userInput.value.trim();
    if (!prompt) return;

    if (!isModelLoaded) {
        generateBtn.disabled = true;
        await initModel();
        generateBtn.disabled = false;
        if (!isModelLoaded) return;
    }

    generateBtn.disabled = true;
    outputPlaceholder.classList.add('hidden');
    outputResult.classList.remove('hidden');
    outputText.innerText = "프롬프트 생성 중...";
    outputText.style.opacity = '0.5';

    try {
        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Create a detailed image prompt for: ${prompt}` }
        ];

        const reply = await engine.chat.completions.create({ messages });
        let result = reply.choices[0].message.content;

        // Remove <think> tags
        result = removeThinkTags(result);

        outputText.innerText = result;
        outputText.style.opacity = '1';

    } catch (error) {
        console.error("Generation Failed:", error);
        outputText.innerText = "오류: 프롬프트를 생성할 수 없습니다.";
        outputText.style.opacity = '1';
    } finally {
        generateBtn.disabled = false;
    }
}

// Event Listeners
generateBtn.addEventListener('click', handleGenerate);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleGenerate(e);
});
copyBtn.addEventListener('click', copyToClipboard);
