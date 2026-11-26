// =========================================================================
// 1. RETRATOS DE LOS FILÓSOFOS (assets/philosophers/<id>.jpg)
// =========================================================================
const PORTRAIT_DIR = 'assets/philosophers/';

function getPortraitUrl(philId) {
  return `${PORTRAIT_DIR}${philId}.jpg`;
}

function buildPortraitInnerMarkup(philId, altName) {
  return `<img src="${getPortraitUrl(philId)}" alt="${escapeHtml(altName)}" class="chiaroscuro-img relative z-10 w-full h-full" />`;
}

// Tarjeta: en celular el retrato de cara; en escritorio el cuerpo completo
function getCardVideoUrl(philId) {
  return `${PORTRAIT_DIR}video/${philId}.mp4`;
}

function getCardPosterUrl(philId) {
  return `${PORTRAIT_DIR}video/${philId}.jpg`;
}

// Tarjeta: video de cuerpo completo en bucle (en celular se encuadra la parte de arriba)
function buildCardPortraitMarkup(philId, altName) {
  return `
    <video
      class="card-video relative z-10 w-full h-full object-cover object-[center_8%] desk:object-center"
      poster="${getCardPosterUrl(philId)}"
      muted loop playsinline preload="none"
      aria-label="${escapeHtml(altName)}"
    >
      <source src="${getCardVideoUrl(philId)}" type="video/mp4" />
    </video>
  `;
}

async function fetchWithBackoff(url, options, maxRetries = 3) {
  let delay = 1000;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return await response.json();
      if (response.status !== 429 && response.status < 500) break;
    } catch (err) {
      if (attempt === maxRetries) return null;
    }
    if (attempt < maxRetries) {
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }
  return null;
}

// =========================================================================
// 2. BILINGUAL COPY & PHILOSOPHERS DATA
// =========================================================================
// Franja del día según la hora local: mañana 05–11, tarde 12–18, noche 19–04
function getDayPeriod() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 19) return 'afternoon';
  return 'night';
}

// Textos que dependen de la hora del día
const TIME_COPY = {
  en: {
    morning: {
      brandTagline: 'Philosophical Dialogues'
    },
    afternoon: {
      brandTagline: 'Philosophical Dialogues'
    },
    night: {
      brandTagline: 'Philosophical Dialogues'
    }
  },
  es: {
    morning: {
      brandTagline: 'Diálogos Filosóficos'
    },
    afternoon: {
      brandTagline: 'Diálogos Filosóficos'
    },
    night: {
      brandTagline: 'Diálogos Filosóficos'
    }
  }
};

function getTimeCopy() {
  return TIME_COPY[currentLang][getDayPeriod()];
}

function getGreeting(locale) {
  const g = locale.greeting;
  return typeof g === 'string' ? g : g[getDayPeriod()];
}

const UI_COPY = {
  en: {
    heroTitle: 'Ask Questions and Converse with the Greatest Minds of All Time.',
    topics: { all: 'All', ethics: 'Ethics', reality: 'Reality', justice: 'Justice' },
    footerNote: 'Interactive acoustic sanctuary · Converse aloud in real time or reflect in writing.',
    footerMotto: '“Γνῶθι σεαυτόν” — Know Thyself',
    voiceIdle: 'Tap the golden microphone to speak.',
    voiceListening: 'Listening in the stillness… speak your thought.',
    voiceSpeaking: 'Speaking aloud… tap the speaker icon to mute.',
    talkBtnPrefix: 'Converse with',
    speechUnsupported: 'Voice dictation is unavailable in this browser. Please type your inquiry below.'
  },
  es: {
    heroTitle: 'Haz preguntas y conversa con las mentes más grandes de todos los tiempos.',
    topics: { all: 'Todos', ethics: 'Ética', reality: 'Realidad', justice: 'Justicia' },
    footerNote: 'Santuario acústico interactivo · Habla en tiempo real o reflexiona por escrito.',
    footerMotto: '«Γνῶθι σεαυτόν» — Conócete a ti mismo',
    voiceIdle: 'Toca el micrófono dorado para hablar.',
    voiceListening: 'Escuchando en silencio… expresa tu inquietud.',
    voiceSpeaking: 'Hablando en voz alta… toca el altavoz para silenciar.',
    talkBtnPrefix: 'Conversar con',
    speechUnsupported: 'Tu navegador no soporta dictado por voz. Escribe tu pregunta abajo.'
  }
};

const PHILOSOPHERS = [
  {
    id: 'socrates',
    numeral: 'I',
    topic: 'ethics',
    voicePitch: 0.92,
    voiceRate: 0.94,
    en: {
      name: 'Socrates',
      city: 'ATHENS',
      era: '470–399 BCE',
      school: 'Ethics & Maieutics',
      question: 'What does it mean to live well?',
      epigraph: '“The unexamined life is not worth living.”',
      systemPersona: 'You are Socrates of Athens speaking in an intimate philosophical dialogue. Reply concisely (2 to 4 sentences) in English using gentle Socratic irony and probing questions (maieutics) that invite the user to examine their own soul and assumptions.',
      greeting: {
        morning: 'Good morning, friend. Before the marketplace fills with noise, tell me—when you speak of living well, what do you hold to be truly good for the soul?',
        afternoon: 'Welcome to the calm of the afternoon, friend. Away from the noise of the marketplace, tell me—when you speak of living well, what do you hold to be truly good for the soul?',
        night: 'Welcome to the quiet of the evening, friend. Away from the noise of the marketplace, tell me—when you speak of living well, what do you hold to be truly good for the soul?'
      },
      starters: [
        'What does it mean to live well?',
        'Why do we fear admitting our ignorance?',
        'Can virtue be taught?'
      ],
      responses: [
        {
          keywords: ['live', 'well', 'good', 'happy', 'happiness', 'wealth', 'success'],
          reply: 'In quiet reflection, honors and gold lose their glitter, do they not? Tell me: can any possession benefit us if our soul lacks the wisdom to use it rightly? Perhaps living well begins with tending the integrity of our character.'
        },
        {
          keywords: ['know', 'ignorance', 'wisdom', 'truth', 'fear'],
          reply: 'To realize that we do not know is not darkness—it is the first spark of genuine inquiry. When we lay aside false certainty together, what truth begins to emerge for you?'
        }
      ],
      defaultReplies: [
        'A question worthy of unhurried reflection. Yet before we rush ahead, how would you define the essential virtue hidden inside your question?',
        'Let us test that thought gently together: if everyone lived by that principle, would our souls grow wiser and more harmonious, or more restless?'
      ]
    },
    es: {
      name: 'Sócrates',
      city: 'ATENAS',
      era: '470–399 a. C.',
      school: 'Ética y Mayéutica',
      question: '¿Qué significa vivir bien?',
      epigraph: '«Una vida sin examen no merece ser vivida.»',
      systemPersona: 'Eres Sócrates de Atenas conversando serenamente en un diálogo filosófico. Responde de forma breve y elocuente (2 a 4 oraciones) en español usando la mayéutica: cálido, agudo y formulando preguntas que ayuden al interlocutor a examinar sus propias ideas.',
      greeting: {
        morning: 'Buenos días, amigo mío. Antes de que el Ágora se llene de bullicio, dime con sinceridad: cuando piensas en una vida bien vivida, ¿qué consideras lo más valioso para el alma?',
        afternoon: 'Bienvenido a la calma de esta tarde, amigo mío. Lejos del bullicio del Ágora, dime con sinceridad: cuando piensas en una vida bien vivida, ¿qué consideras lo más valioso para el alma?',
        night: 'Bienvenido a la calma de esta noche, amigo mío. Lejos del bullicio del Ágora, dime con sinceridad: cuando piensas en una vida bien vivida, ¿qué consideras lo más valioso para el alma?'
      },
      starters: [
        '¿Qué significa vivir bien?',
        '¿Por qué tememos reconocer nuestra ignorancia?',
        '¿Puede enseñarse la virtud?'
      ],
      responses: [
        {
          keywords: ['vivir', 'bien', 'feliz', 'felicidad', 'riqueza', 'dinero', 'exito', 'éxito'],
          reply: 'En la quietud de la reflexión los honores y las riquezas pierden su brillo pasajero, ¿no te parece? Dime: ¿de qué sirve poseer mucho si el alma ignora cómo obrar con justicia? Quizá vivir bien consista en cuidar ante todo la rectitud de nuestro interior.'
        },
        {
          keywords: ['saber', 'ignorancia', 'sabiduria', 'sabiduría', 'verdad', 'temor', 'miedo'],
          reply: 'Reconocer lo que aún no sabemos no es oscuridad, sino la primera chispa de la sabiduría. Cuando soltamos las certezas prestadas, ¿qué pregunta esencial queda en pie para ti?'
        }
      ],
      defaultReplies: [
        'Una inquietud digna de examinarse sin prisa. Pero dime primero: ¿qué entiendes tú exactamente por el bien que buscas en ella?',
        'Pongamos a prueba esa idea como buenos amigos: si la lleváramos hasta sus últimas consecuencias en tu vida diaria, ¿haría tu alma más libre y justa?'
      ]
    }
  },
  {
    id: 'plato',
    numeral: 'II',
    topic: 'reality',
    voicePitch: 0.98,
    voiceRate: 0.93,
    en: {
      name: 'Plato',
      city: 'THE ACADEMY',
      era: '428–348 BCE',
      school: 'Metaphysics & Eternal Forms',
      question: 'Can we trust what we see?',
      epigraph: '“Time is the moving image of eternity.”',
      systemPersona: 'You are Plato speaking in the peaceful gardens of the Academy. Reply concisely (2 to 4 sentences) in English with poetic philosophical depth, drawing naturally on eternal Forms, light vs shadow, harmony of the soul, and contemplation.',
      greeting: {
        morning: 'Peace be with you this morning at the Academy. As the sun scatters the shadows, reason awakens the eye of the soul. What unseen truth are you seeking today?',
        afternoon: 'Peace be with you this quiet afternoon at the Academy. As the light turns golden, the soul inclines toward contemplation. What unseen truth are you seeking today?',
        night: 'Peace be with you under the stars of the Academy. Night quiets the distractions of the senses so the eye of the soul may awaken. What unseen truth are you seeking tonight?'
      },
      starters: [
        'Can we trust what we see?',
        'Are we still inside a modern Cave of shadows?',
        'What is the connection between love and eternity?'
      ],
      responses: [
        {
          keywords: ['see', 'trust', 'cave', 'shadow', 'shadows', 'reality', 'senses', 'illusion'],
          reply: 'Sensory things flicker like firelight on the wall of a cavern—always becoming, never truly being. Yet when reason turns away from fleeting shadows toward eternal Forms, we behold what is unchanging and real.'
        },
        {
          keywords: ['love', 'beauty', 'eternity', 'soul', 'stars'],
          reply: 'Wonder and love give wings to the soul. Beginning with earthly beauty, the contemplative mind ascends step by step until it beholds Beauty itself—pure, timeless, and luminous beyond the stars.'
        }
      ],
      defaultReplies: [
        'Look past the shifting surface of events, my friend. What eternal Form or ideal gives measure and meaning to what you describe?',
        'Just as night reveals constellations invisible at noon, quiet contemplation reveals order in the soul. Where do you glimpse that higher harmony?'
      ]
    },
    es: {
      name: 'Platón',
      city: 'LA ACADEMIA',
      era: '428–348 a. C.',
      school: 'Metafísica y Mundo de las Ideas',
      question: '¿Podemos confiar en lo que vemos?',
      epigraph: '«El tiempo es la imagen móvil de la eternidad.»',
      systemPersona: 'Eres Platón conversando en los serenos jardines de la Academia. Responde de forma concisa y poética (2 a 4 oraciones) en español, aludiendo con naturalidad al mundo sensible frente a las Ideas eternas, la caverna, la belleza y la armonía del alma.',
      greeting: {
        morning: 'La paz te acompañe en esta mañana de la Academia. Así como la luz del sol disipa las sombras, la razón despierta el ojo del alma. ¿Qué verdad invisible deseas contemplar hoy?',
        afternoon: 'La paz te acompañe en esta tarde serena de la Academia. Cuando la luz se vuelve dorada, el alma se inclina a contemplar. ¿Qué verdad invisible deseas contemplar hoy?',
        night: 'La paz te acompañe bajo el cielo estrellado de la Academia. Cuando la noche aquieta el engaño de los sentidos, se abre el ojo del alma. ¿Qué verdad invisible deseas contemplar esta noche?'
      },
      starters: [
        '¿Podemos confiar en lo que vemos?',
        '¿Vivimos hoy en una nueva Caverna de sombras?',
        '¿Qué une al amor con la eternidad?'
      ],
      responses: [
        {
          keywords: ['ver', 'vemos', 'confiar', 'caverna', 'sombras', 'realidad', 'sentidos', 'apariencia'],
          reply: 'Lo que captan los ojos cambia sin cesar, igual que las sombras proyectadas por una hoguera en la caverna. Solo cuando el intelecto se vuelve hacia las Ideas eternas contemplamos lo que verdaderamente es.'
        },
        {
          keywords: ['amor', 'belleza', 'eternidad', 'alma', 'estrellas'],
          reply: 'El verdadero amor da alas al alma: parte del asombro ante una forma bella y asciende hacia la belleza de las ideas, hasta vislumbrar la Belleza absoluta e incorruptible.'
        }
      ],
      defaultReplies: [
        'Elevemos la mirada por encima de las apariencias cambiantes: ¿qué Idea eterna o arquetipo universal sostiene aquello por lo que preguntas?',
        'Así como la noche permite ver constelaciones ocultas durante el día, el recogimiento revela la armonía del alma. ¿Hacia dónde apunta tu anhelo de verdad?'
      ]
    }
  },
  {
    id: 'aristotle',
    numeral: 'III',
    topic: 'justice',
    voicePitch: 1.0,
    voiceRate: 0.96,
    en: {
      name: 'Aristotle',
      city: 'THE LYCEUM',
      era: '384–322 BCE',
      school: 'Virtue Ethics & Phronesis',
      question: 'How do we learn to be just?',
      epigraph: '“Excellence is not an act, propensity, or accident, but a habit.”',
      systemPersona: 'You are Aristotle conversing in the evening colonnade of the Lyceum. Reply concisely (2 to 4 sentences) in English with clear, grounded practical wisdom (phronesis), focusing on habits, the Golden Mean, empirical observation, and eudaimonia.',
      greeting: {
        morning: 'Welcome to the morning walkways of the Lyceum. Philosophy begins in wonder at the cosmos above and human action here below. What practical question shall we examine together this morning?',
        afternoon: 'Welcome to the afternoon walkways of the Lyceum. Philosophy begins in wonder at the cosmos above and human action here below. What practical question shall we examine together this afternoon?',
        night: 'Welcome to the evening walkways of the Lyceum. Philosophy begins in wonder at the cosmos above and human action here below. What practical question shall we examine together tonight?'
      },
      starters: [
        'How do we learn to be just?',
        'How do I find the Golden Mean in daily decisions?',
        'What makes a friendship truly noble?'
      ],
      responses: [
        {
          keywords: ['just', 'justice', 'learn', 'habit', 'habits', 'virtue', 'practice'],
          reply: 'Nature gives us the capacity to receive virtues, and habit brings them to maturity. We become just not merely by debating justice, but by choosing just actions consistently until excellence becomes second nature.'
        },
        {
          keywords: ['mean', 'golden', 'balance', 'extreme', 'moderation', 'decision'],
          reply: 'Moral excellence aims at the intermediate—the Golden Mean relative to us, guided by practical wisdom. To feel anger or desire at the right time, toward the right person, and in the right measure is the mark of mastery.'
        }
      ],
      defaultReplies: [
        'Let us ground our inquiry in lived experience: every deliberate action aims at some end. What flourishing or concrete good are you seeking to cultivate here?',
        'Practical wisdom discerns particulars, not merely abstractions. What small, deliberate habit tomorrow morning would embody the virtue you seek today?'
      ]
    },
    es: {
      name: 'Aristóteles',
      city: 'EL LICEO',
      era: '384–322 a. C.',
      school: 'Ética de la Virtud y Prudencia',
      question: '¿Cómo aprendemos a ser justos?',
      epigraph: '«Somos lo que hacemos día a día; la excelencia es un hábito.»',
      systemPersona: 'Eres Aristóteles conversando en los pórticos nocturnos del Liceo. Responde de manera clara, lúcida y concisa (2 a 4 oraciones) en español desde la sabiduría práctica (phronesis), el justo medio, los hábitos y la eudaimonía.',
      greeting: {
        morning: 'Bienvenido a los paseos matutinos del Liceo. Toda filosofía comienza con el asombro ante el orden del cosmos y la acción humana. ¿Qué cuestión práctica deseas dilucidar esta mañana?',
        afternoon: 'Bienvenido a los pórticos del Liceo en esta tarde. Toda filosofía comienza con el asombro ante el orden del cosmos y la acción humana. ¿Qué cuestión práctica deseas dilucidar esta tarde?',
        night: 'Bienvenido a los pórticos serenos del Liceo. Toda filosofía comienza con el asombro ante el orden del cosmos y la acción humana. ¿Qué cuestión práctica deseas dilucidar esta noche?'
      },
      starters: [
        '¿Cómo aprendemos a ser justos?',
        '¿Cómo hallar el justo medio en mis decisiones?',
        '¿Qué distingue a la amistad verdadera?'
      ],
      responses: [
        {
          keywords: ['justo', 'justos', 'justicia', 'aprender', 'aprendemos', 'habito', 'hábito', 'hábitos', 'virtud'],
          reply: 'Ninguna virtud ética nace en nosotros por mera casualidad: adquirimos la justicia practicando actos justos, igual que el citarista perfecciona su arte tocando día tras día con deliberación.'
        },
        {
          keywords: ['medio', 'equilibrio', 'extremo', 'decision', 'decisión', 'prudencia'],
          reply: 'La excelencia moral busca el justo medio respecto a nosotros, determinado por la prudencia: acertar en el momento, el motivo y la medida adecuados entre el exceso y el defecto.'
        }
      ],
      defaultReplies: [
        'Observemos la realidad concreta con rigor: toda elección humana tiende hacia algún fin. ¿Qué plenitud o bien realizable buscas forjar en esta situación?',
        'La prudencia o phronesis se demuestra en la acción particular. ¿Qué pequeño hábito deliberado podrías iniciar mañana para encarnar esa virtud?'
      ]
    }
  }
];

// =========================================================================
// 3. STATE & RENDERING MONOLITH CARDS
// =========================================================================
let currentLang = 'en';
let currentTopic = 'all';
let activePhilosopher = null;
let ttsEnabled = true;
let isListening = false;
let recognition = null;
let conversationHistory = [];

function renderPhilosopherCards() {
  const grid = document.getElementById('philosophersGrid');
  const copy = UI_COPY[currentLang];
  const filtered = PHILOSOPHERS.filter(p => currentTopic === 'all' || p.topic === currentTopic);

  grid.innerHTML = filtered.map(phil => {
    const locale = phil[currentLang];

    return `
      <article data-phil="${phil.id}" class="monolith-card group rounded-[24px] shadow-monolith hover:shadow-monolith-hover transition-all duration-500 p-4 sm:p-5 desk:p-0 overflow-hidden flex flex-col justify-between">
        <!-- Mobile Horizontal Layout (<920px) / Desktop Dramatic Chiaroscuro Monolith (>=920px) -->
        <div class="flex flex-row items-center gap-4 sm:gap-5 desk:flex-col desk:items-stretch desk:gap-0">

          <!-- Portrait Container -->
          <div
            onclick="openAgoraSession('${phil.id}')"
            class="cursor-pointer w-[114px] h-[128px] sm:w-[140px] sm:h-[152px] desk:w-full desk:h-auto desk:aspect-[2/3] rounded-2xl desk:rounded-none overflow-hidden relative shrink-0 bg-obsidian-800 border border-aurum/25 desk:border-0"
          >
            <!-- Dynamic Photorealistic Portrait Slot -->
            <div id="portrait-slot-${phil.id}" class="absolute inset-0 w-full h-full">
              ${buildCardPortraitMarkup(phil.id, locale.name)}
            </div>

            <!-- Deep Chiaroscuro Fade into Dark Obsidian Card Body (Desktop) -->
            <div class="hidden desk:block pointer-events-none absolute inset-x-0 bottom-0 h-32 z-20 bg-gradient-to-t from-[#14110F] via-[#14110F]/70 to-transparent"></div>

            <!-- Subtle Warm Candlelight Rim Glow -->
            <div class="pointer-events-none absolute inset-0 z-20 ring-1 ring-inset ring-aurum/15"></div>
          </div>

          <!-- Editorial Dark Typography Block -->
          <div class="flex-1 min-w-0 desk:px-6 desk:-mt-6 desk:pb-4 relative z-20 flex flex-col justify-center desk:text-center">
            <div class="flex items-center desk:justify-center gap-2 mb-1">
              <span class="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-aurum/90 truncate">
                ${locale.school}
              </span>
            </div>

            <h2 class="font-serif text-[32px] sm:text-[36px] desk:text-[42px] font-semibold text-ivory-primary leading-[1.04] tracking-tight">
              ${locale.name}
            </h2>
          </div>
        </div>

        <!-- Burnished Gold & Obsidian Primary Action Button -->
        <div class="mt-4 desk:mt-2 desk:px-6 desk:pb-6 relative z-20">
          <button
            type="button"
            onclick="openAgoraSession('${phil.id}')"
            class="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#C89B42] via-[#E2BC6B] to-[#C89B42] hover:brightness-110 active:scale-[0.99] text-obsidian-950 shadow-gold-cta hover:shadow-gold-cta-hover transition-all duration-300 flex items-center justify-center gap-3 group/cta"
          >
            <svg class="w-5 h-5 text-obsidian-950 shrink-0 transition-transform duration-300 group-hover/cta:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="9" y="2" width="6" height="11" rx="3"></rect>
              <path d="M5 10a7 7 0 0 1 14 0"></path>
              <line x1="12" y1="17" x2="12" y2="21"></line>
              <line x1="8" y1="21" x2="16" y2="21"></line>
            </svg>
            <span class="font-serif text-[20px] sm:text-[21px] font-bold tracking-[0.01em] leading-none">
              ${copy.talkBtnPrefix} ${locale.name}
            </span>
          </button>
        </div>
      </article>
    `;
  }).join('');
  setupCardVideos();
}

function updateStaticCopy() {
  const copy = UI_COPY[currentLang];
  document.documentElement.lang = currentLang;

  const timeCopy = getTimeCopy();
  document.getElementById('brandTagline').textContent = timeCopy.brandTagline;
  document.getElementById('heroTitle').textContent = copy.heroTitle;

  // Paquetes de créditos
  const es = currentLang === 'es';
  document.querySelectorAll('.credits-word').forEach((el) => { el.textContent = es ? 'créditos' : 'credits'; });
  document.querySelectorAll('.buy-word').forEach((el) => { el.textContent = es ? 'Comprar' : 'Buy'; });
  document.querySelectorAll('.popular-word').forEach((el) => { el.textContent = es ? 'Más popular' : 'Most Popular'; });
  const balanceLabel = document.getElementById('balanceLabel');
  if (balanceLabel) balanceLabel.textContent = es ? 'Saldo actual:' : 'Current Balance:';
  document.getElementById('footerNote').textContent = copy.footerNote;
  document.getElementById('footerMotto').textContent = copy.footerMotto;

  if (!isListening) {
    document.getElementById('voiceStateCaption').textContent = copy.voiceIdle;
  }

  document.querySelectorAll('.topic-btn, .topic-btn-mobile').forEach(btn => {
    const topic = btn.getAttribute('data-topic');
    if (copy.topics[topic]) btn.textContent = copy.topics[topic];
  });

  const enBtn = document.getElementById('langEnBtn');
  const esBtn = document.getElementById('langEsBtn');
  if (currentLang === 'en') {
    enBtn.className = 'px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wider transition-all bg-aurum text-obsidian-950';
    esBtn.className = 'px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wider transition-all text-ivory-secondary hover:text-ivory-primary';
  } else {
    esBtn.className = 'px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wider transition-all bg-aurum text-obsidian-950';
    enBtn.className = 'px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wider transition-all text-ivory-secondary hover:text-ivory-primary';
  }
}

function setLanguage(lang) {
  if (lang === currentLang) return;
  currentLang = lang;
  updateStaticCopy();
  updateCreditUI();
  renderPhilosopherCards();
  if (activePhilosopher) {
    populateModalHeader(activePhilosopher);
  }
}

function setTopicFilter(topic) {
  currentTopic = topic;

  document.querySelectorAll('.topic-btn').forEach(btn => {
    const active = btn.getAttribute('data-topic') === topic;
    btn.className = active
      ? 'topic-btn px-3.5 py-1.5 rounded-full text-xs transition-all bg-aurum text-obsidian-950 font-semibold shadow-sm'
      : 'topic-btn px-3.5 py-1.5 rounded-full text-xs font-medium transition-all text-ivory-secondary hover:text-ivory-primary';
  });

  document.querySelectorAll('.topic-btn-mobile').forEach(btn => {
    const active = btn.getAttribute('data-topic') === topic;
    btn.className = active
      ? 'topic-btn-mobile shrink-0 px-3.5 py-1 rounded-full text-xs font-semibold border transition-all bg-aurum text-obsidian-950 border-aurum'
      : 'topic-btn-mobile shrink-0 px-3.5 py-1 rounded-full text-xs font-medium border transition-all bg-obsidian-850/90 text-ivory-secondary border-aurum/20';
  });

  renderPhilosopherCards();
}

function resetFilter(event) {
  if (event) event.preventDefault();
  setTopicFilter('all');
}

// =========================================================================
// 4. DIALOGUE CHAMBER & LIVE AI + CURATED DIALOGUE ENGINE
// =========================================================================
function populateModalHeader(phil) {
  const locale = phil[currentLang];
  document.getElementById('modalPhilName').textContent = locale.name;
  document.getElementById('modalPhilMeta').textContent = `${locale.era} · ${locale.school}`;
  document.getElementById('modalEpigraph').textContent = locale.epigraph;

  // Si el avatar de este filósofo ya está montado (p. ej. al cambiar de idioma), no se recrea
  if (activeAvatarId === phil.id) return;
  destroyAvatar();
  const stage = document.getElementById('modalPortraitStage');
  stage.innerHTML = `
    <img src="${getPortraitUrl(phil.id)}" alt="${escapeHtml(locale.name)}" class="chiaroscuro-img w-full h-full" />
  `;
  mountAvatar(stage, phil.id);
}

// =========================================================================
// AVATAR PARLANTE (js/avatar.js)
// =========================================================================
// Interruptor del avatar del chat (boca, parpadeo y respiración en el retrato).
// false = foto fija en el chat. Cambia a true para volver a activarlo.
const CHAT_AVATAR_ENABLED = false;

let activeAvatar = null;
let activeAvatarId = null;
let avatarMountToken = 0;

async function mountAvatar(stage, philId) {
  activeAvatarId = philId;
  if (!CHAT_AVATAR_ENABLED || typeof window.createTalkingAvatar !== 'function') return;
  const token = ++avatarMountToken;
  const avatar = await window.createTalkingAvatar(stage, getPortraitUrl(philId), philId);
  // Si mientras cargaba se cerró la sesión o se cambió de filósofo, se descarta
  if (token !== avatarMountToken || activeAvatarId !== philId) {
    if (avatar) avatar.destroy();
    return;
  }
  activeAvatar = avatar;
}

function destroyAvatar() {
  avatarMountToken++;
  if (activeAvatar) activeAvatar.destroy();
  activeAvatar = null;
  activeAvatarId = null;
}

function setAvatarSpeaking(on, volumeFn = null) {
  if (activeAvatar) activeAvatar.setSpeaking(on, volumeFn);
}

let activeElevenConversation = null;
let pendingConnectingConversation = null; // promesa en curso de conexión a ElevenLabs
let sessionUsesEleven = false;   // la sesión actual usa la voz en vivo de ElevenLabs
let elevenSessionToken = 0;
let pendingElevenPrompt = null;  // pregunta para enviar en cuanto conecte

/**
 * Cierra de forma garantizada cualquier sesión activa o en proceso de conexión con ElevenLabs
 * para evitar el consumo de créditos.
 */
async function terminateElevenLabsSession() {
  elevenSessionToken++;
  sessionUsesEleven = false;
  pendingElevenPrompt = null;

  if (activeElevenConversation) {
    const conv = activeElevenConversation;
    activeElevenConversation = null;
    try {
      if (typeof conv.endSession === 'function') {
        await conv.endSession();
      }
    } catch (e) {
      console.warn('ElevenLabs endSession aviso:', e);
    }
  }

  if (pendingConnectingConversation) {
    try {
      const pendingConv = await pendingConnectingConversation;
      if (pendingConv && typeof pendingConv.endSession === 'function') {
        await pendingConv.endSession();
      }
    } catch (e) {}
    pendingConnectingConversation = null;
  }
}

// -------------------------------------------------------------------------
// AGENTES DE ELEVENLABS POR FILÓSOFO
// Todos pueden usar el MISMO agente: al iniciar la llamada la app le envía
// la personalidad, el saludo y el idioma de cada filósofo ("overrides").
// - agentId:  agente a usar ('' = sin ElevenLabs: texto + voz del navegador)
// - override: true = enviar personalidad/saludo/idioma de este filósofo
// - voiceId:  voz de ElevenLabs para este filósofo ('' = la voz del agente)
// Requisito para override: en ElevenLabs → tu agente → Security → activar
// overrides de "System prompt", "First message", "Language" (y "Voice" si usas voiceId).
// -------------------------------------------------------------------------
const ELEVEN_DEFAULT_AGENT_ID = 'agent_1201m7r2a49afm7s1gqqwj2eysw3';
const ELEVEN_AGENTS = {
  socrates:  { agentId: ELEVEN_DEFAULT_AGENT_ID, override: false, voiceId: '' },
  plato:     { agentId: 'agent_9001m7r5e4d1fg7tjv4j01g2f85x', override: false, voiceId: '' },
  aristotle: { agentId: 'agent_6301m6pgw2h9eyds9vt2bwx8eh5m', override: false, voiceId: '' }
};

function usesElevenLabs(phil) {
  return !!(phil && ELEVEN_AGENTS[phil.id] && ELEVEN_AGENTS[phil.id].agentId);
}

function getTimeOfDayNote() {
  const period = getDayPeriod();
  return currentLang === 'es'
    ? `Para el usuario ahora es ${{ morning: 'de mañana', afternoon: 'de tarde', night: 'de noche' }[period]}; adapta cualquier referencia a la hora del día (mañana, tarde o noche) a ese momento.`
    : `For the user it is currently ${{ morning: 'morning', afternoon: 'afternoon', night: 'night' }[period]}; adapt any reference to the time of day accordingly.`;
}

function buildElevenOverrides(phil) {
  const cfg = ELEVEN_AGENTS[phil.id];
  if (!cfg || !cfg.override) return undefined;
  const locale = phil[currentLang];
  const overrides = {
    agent: {
      prompt: { prompt: `${locale.systemPersona} ${getTimeOfDayNote()}` },
      firstMessage: getGreeting(locale),
      language: currentLang
    }
  };
  if (cfg.voiceId) overrides.tts = { voiceId: cfg.voiceId };
  return overrides;
}

// Si ElevenLabs no está disponible para este filósofo, sigue con texto + voz del navegador
function fallbackToLocalVoice(phil) {
  if (!activePhilosopher || activePhilosopher.id !== phil.id || !sessionUsesEleven) return;
  sessionUsesEleven = false;
  const greeting = getGreeting(phil[currentLang]);
  const prompt = pendingElevenPrompt;
  pendingElevenPrompt = null;
  if (prompt) setTimeout(() => submitUserQuestion(prompt), 320);
  else speakPhilosopherText(greeting);
}

async function startElevenLabsSession(phil) {
  const name = () => phil[currentLang].name;
  const isEn = () => currentLang === 'en';
  if (typeof ElevenLabsClient === 'undefined' || !ElevenLabsClient.Conversation) {
    console.warn('ElevenLabs SDK no cargó; se usa la voz del navegador.');
    fallbackToLocalVoice(phil);
    return;
  }
  const token = ++elevenSessionToken;
  let connected = false;
  const isCurrent = () => token === elevenSessionToken && activePhilosopher && activePhilosopher.id === phil.id;

  try {
    setVocalizingUI(false, isEn() ? `Connecting call with ${name()}…` : `Conectando llamada con ${name()}…`);
    const sessionPromise = ElevenLabsClient.Conversation.startSession({
      agentId: ELEVEN_AGENTS[phil.id].agentId,
      overrides: buildElevenOverrides(phil),
      onConnect: () => {
        if (!isCurrent()) return;
        connected = true;
        startMicMeter();
        setVocalizingUI(false, isEn() ? `${name()} is listening. Speak to him!` : `${name()} te escucha. ¡Háblale!`);
        showToast(isEn() ? `Call connected with ${name()}!` : `¡Llamada conectada con ${name()}!`);
      },
      onDisconnect: () => {
        if (!isCurrent()) return;
        setAvatarSpeaking(false);
        stopMicMeter();
        activeElevenConversation = null;
        if (!connected) {
          // Rechazada antes de conectar (p. ej. overrides no habilitados en el agente)
          console.warn(`ElevenLabs rechazó la sesión de ${phil.id}. Revisa los overrides del agente.`);
          fallbackToLocalVoice(phil);
          return;
        }
        setVocalizingUI(false, isEn() ? 'Call concluded.' : 'Llamada concluida.');
      },
      onError: (err) => {
        console.error('ElevenLabs error:', err);
        if (!isCurrent() || !connected) return;
        showToast((isEn() ? 'Notice: ' : 'Aviso: ') + (typeof err === 'string' ? err : err?.message || (isEn() ? 'Connection error' : 'Error de conexión')));
      },
      onModeChange: ({ mode }) => {
        if (!isCurrent()) return;
        const stage = document.getElementById('modalPortraitStage');
        if (mode === 'speaking') {
          setVocalizingUI(true, isEn() ? `${name()} is speaking…` : `${name()} está hablando…`);
          // La boca sigue el volumen real de la voz de ElevenLabs
          const conv = activeElevenConversation;
          setAvatarSpeaking(true, conv && typeof conv.getOutputVolume === 'function' ? () => conv.getOutputVolume() : null);
          if (stage) stage.classList.add('ring-4', 'ring-aurum', 'shadow-[0_0_40px_rgba(212,168,83,0.45)]');
        } else {
          setVocalizingUI(false, isEn() ? `Listening… speak with ${name()}.` : `Escuchando… habla con ${name()}.`);
          setAvatarSpeaking(false);
          if (stage) stage.classList.remove('ring-4', 'ring-aurum', 'shadow-[0_0_40px_rgba(212,168,83,0.45)]');
        }
      },
    });

    pendingConnectingConversation = sessionPromise;
    const conversation = await sessionPromise;
    pendingConnectingConversation = null;

    // Si mientras conectaba se cerró la sesión o se cambió de filósofo, se cuelga
    if (!isCurrent()) {
      try { await conversation.endSession(); } catch (e) {}
      return;
    }
    activeElevenConversation = conversation;

    if (pendingElevenPrompt) {
      const prompt = pendingElevenPrompt;
      pendingElevenPrompt = null;
      try { conversation.sendUserMessage(prompt); } catch (e) { console.error(e); }
    }
  } catch (err) {
    pendingConnectingConversation = null;
    console.error('Error starting ElevenLabs:', err);
    if (!isCurrent()) return;
    const micDenied = err && (err.name === 'NotAllowedError' || /permission|microphone|micr/i.test(err.message || ''));
    if (micDenied) {
      showToast(isEn() ? 'Please allow microphone access to talk.' : 'Permite el acceso al micrófono para hablar.');
      setVocalizingUI(false, isEn() ? 'Please allow microphone access in your browser.' : 'Permite el acceso al micrófono en el navegador.');
    } else {
      fallbackToLocalVoice(phil);
    }
  }
}

async function openAgoraSession(philosopherId, initialPrompt = null) {
  if (userCreditsRemainingSec <= 0) {
    showToast(currentLang === 'en'
      ? 'You have run out of credits. Please choose a package to continue.'
      : 'Te quedaste sin créditos. Por favor elige un paquete para continuar.');
    openStripeModal(true);
    return;
  }

  const phil = PHILOSOPHERS.find(p => p.id === philosopherId);
  if (!phil) return;

  stopSpeaking();
  stopVoiceRecognition();
  stopSessionCreditCountdown();
  await terminateElevenLabsSession();

  activePhilosopher = phil;
  conversationHistory = [];

  populateModalHeader(phil);
  startSessionCreditCountdown();
  startWaveLevelsLoop();
  setCardVideosPaused(true);

  const modal = document.getElementById('agoraModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';

  const locale = phil[currentLang];

  sessionUsesEleven = usesElevenLabs(phil);
  pendingElevenPrompt = null;
  if (sessionUsesEleven) {
    pendingElevenPrompt = initialPrompt;
    startElevenLabsSession(phil);
  } else {
    const greeting = getGreeting(locale);
    if (initialPrompt) {
      setTimeout(() => submitUserQuestion(initialPrompt), 320);
    } else {
      speakPhilosopherText(greeting);
    }
  }
}

async function closeAgoraSession() {
  // 1. Detener inmediatamente el consumo de créditos y persistir el saldo restante
  stopSessionCreditCountdown();
  saveCreditsToStorage();
  showLowCreditWarning(false);

  // 2. Terminar garantizadamente cualquier conexión activa o en curso con ElevenLabs
  await terminateElevenLabsSession();

  // 3. Detener síntesis local de voz y reconocimiento de voz
  stopSpeaking();
  stopVoiceRecognition();

  // 4. Detener pistas del micrófono y visualizador de audio
  stopMicMeter();
  stopWaveLevelsLoop();

  // 5. Ocultar modal y restablecer interfaz
  const modal = document.getElementById('agoraModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  document.body.style.overflow = '';
  destroyAvatar();
  setAvatarSpeaking(false);
  setCardVideosPaused(false);
  activePhilosopher = null;
}

function generateLocalFallbackReply(phil, userText) {
  const locale = phil[currentLang];
  const normalized = userText.toLowerCase();

  for (const item of locale.responses) {
    if (item.keywords.some(kw => normalized.includes(kw))) {
      return item.reply;
    }
  }

  const idx = conversationHistory.length % locale.defaultReplies.length;
  return locale.defaultReplies[idx];
}

// Attempts real Gemini 3 Flash philosophical dialogue, gracefully falling back to curated responses offline
async function fetchPhilosopherReply(phil, userText) {
  const locale = phil[currentLang];
  try {
    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
    const contents = conversationHistory.slice(-6).map(turn => ({
      role: turn.role === 'user' ? 'user' : 'model',
      parts: [{ text: turn.text }]
    }));

    const payload = {
      contents,
      systemInstruction: {
        parts: [{ text: `${locale.systemPersona} ${getTimeOfDayNote()}` }]
      }
    };

    const result = await fetchWithBackoff(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, 2);

    const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (aiText && aiText.trim()) {
      return aiText.trim();
    }
  } catch (e) {}

  return generateLocalFallbackReply(phil, userText);
}

async function submitUserQuestion(questionText) {
  if (!activePhilosopher || !questionText.trim()) return;
  const targetPhil = activePhilosopher;

  if (activeElevenConversation && sessionUsesEleven) {
    stopSpeaking();
    try {
      activeElevenConversation.sendUserMessage(questionText);
    } catch (e) {
      console.error(e);
    }
    return;
  }

  stopSpeaking();
  conversationHistory.push({ role: 'user', text: questionText });

  // Mientras piensa la respuesta
  setVocalizingUI(false, `${targetPhil[currentLang].name}…`);

  const reply = await fetchPhilosopherReply(targetPhil, questionText);

  if (!activePhilosopher || activePhilosopher.id !== targetPhil.id) return;
  conversationHistory.push({ role: 'philosopher', text: reply });
  speakPhilosopherText(reply);
}

// =========================================================================
// 5. VOICE RECOGNITION & SPEECH SYNTHESIS
// =========================================================================
function toggleTTS() {
  ttsEnabled = !ttsEnabled;
  document.getElementById('ttsOnIcon').classList.toggle('hidden', !ttsEnabled);
  document.getElementById('ttsOffIcon').classList.toggle('hidden', ttsEnabled);
  if (!ttsEnabled) stopSpeaking();
}

function setVocalizingUI(active, captionText = null) {
  const waveform = document.getElementById('waveformContainer');
  const aura = document.getElementById('auraRingOuter');
  const caption = document.getElementById('voiceStateCaption');

  if (active) {
    waveform.classList.add('is-vocalizing');
    aura.classList.remove('halo-idle');
    aura.classList.add('halo-active');
  } else {
    waveform.classList.remove('is-vocalizing');
    aura.classList.remove('halo-active');
    aura.classList.add('halo-idle');
  }

  caption.textContent = captionText || UI_COPY[currentLang].voiceIdle;
}

function speakPhilosopherText(text) {
  if (!ttsEnabled || !('speechSynthesis' in window) || !activePhilosopher) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentLang === 'es' ? 'es-ES' : 'en-US';
    utterance.pitch = activePhilosopher.voicePitch || 0.95;
    utterance.rate = activePhilosopher.voiceRate || 0.94;

    utterance.onstart = () => {
      setVocalizingUI(true, UI_COPY[currentLang].voiceSpeaking);
      setAvatarSpeaking(true);
    };
    utterance.onboundary = () => { if (activeAvatar) activeAvatar.pulse(); };
    utterance.onend = () => { setVocalizingUI(false); setAvatarSpeaking(false); };
    utterance.onerror = () => { setVocalizingUI(false); setAvatarSpeaking(false); };

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    setVocalizingUI(false);
  }
}

function stopSpeaking() {
  if ('speechSynthesis' in window) {
    try { window.speechSynthesis.cancel(); } catch (e) {}
  }
  setAvatarSpeaking(false);
  setVocalizingUI(false);
}

function toggleVoiceRecognition() {
  if (activePhilosopher && sessionUsesEleven) {
    const name = activePhilosopher[currentLang].name;
    if (activeElevenConversation) {
      showToast(currentLang === 'en' ? `${name} is listening to you in real time. Speak freely!` : `${name} te está escuchando en tiempo real. ¡Háblale libremente!`);
    } else {
      startElevenLabsSession(activePhilosopher);
    }
    return;
  }

  if (isListening) {
    stopVoiceRecognition();
    return;
  }

  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    showToast(UI_COPY[currentLang].speechUnsupported);
    return;
  }

  stopSpeaking();

  try {
    recognition = new SpeechRec();
    recognition.lang = currentLang === 'es' ? 'es-ES' : 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      startMicMeter();
      isListening = true;
      setVocalizingUI(true, UI_COPY[currentLang].voiceListening);
    };

    recognition.onresult = (event) => {
      let transcriptText = '';
      let isFinal = false;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcriptText += event.results[i][0].transcript;
        if (event.results[i].isFinal) isFinal = true;
      }
      if (isFinal && transcriptText.trim()) {
        const finalQuestion = transcriptText.trim();
        stopVoiceRecognition();
        submitUserQuestion(finalQuestion);
      }
    };

    recognition.onerror = () => stopVoiceRecognition();
    recognition.onend = () => stopVoiceRecognition();

    recognition.start();
  } catch (err) {
    stopVoiceRecognition();
    showToast(UI_COPY[currentLang].speechUnsupported);
  }
}

function stopVoiceRecognition() {
  isListening = false;
  stopMicMeter();
  if (recognition) {
    try { recognition.stop(); } catch (e) {}
    recognition = null;
  }
  setVocalizingUI(false);
}

// =========================================================================
// 6. UTILIDADES
// =========================================================================
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById('toastNotice');
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 3600);
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (activePhilosopher) closeAgoraSession();
    closeStripeModal();
  }
});

/**
 * Cuando el usuario cierra la ventana, pestaña o navega a otra URL,
 * desconecta inmediatamente la llamada de ElevenLabs y congela los créditos.
 */
function handleWindowCloseOrUnload() {
  stopSessionCreditCountdown();
  saveCreditsToStorage();

  if (activeElevenConversation) {
    try {
      if (typeof activeElevenConversation.endSession === 'function') {
        activeElevenConversation.endSession();
      }
    } catch (e) {}
    activeElevenConversation = null;
  }

  stopMicMeter();
  stopSpeaking();
  stopVoiceRecognition();
}

window.addEventListener('beforeunload', handleWindowCloseOrUnload);
window.addEventListener('pagehide', handleWindowCloseOrUnload);

// Si cambia la franja (p. ej. de tarde a noche) con la página abierta, actualiza los textos
let lastDayPeriod = getDayPeriod();
setInterval(() => {
  const period = getDayPeriod();
  if (period !== lastDayPeriod) {
    lastDayPeriod = period;
    updateStaticCopy();
  }
}, 60 * 1000);

window.addEventListener('DOMContentLoaded', () => {
  updateStaticCopy();
  renderPhilosopherCards();
  initCreditSystem();
  initPwaServiceWorker();
});

// =========================================================================
// 7. CRÉDITOS, STRIPE CHECKOUT E INSTALACIÓN PWA
// =========================================================================
// 10 créditos = 1 minuto de conversación (1 crédito cada 6 segundos).
// Internamente el saldo se guarda en segundos; en pantalla se muestra en créditos.
const SECONDS_PER_CREDIT = 6;
const FREE_CREDITS = 50; // prueba gratis (= 5 minutos)
const INITIAL_FREE_SECONDS = FREE_CREDITS * SECONDS_PER_CREDIT;
let userCreditsRemainingSec = INITIAL_FREE_SECONDS;
let sessionCountdownInterval = null;

// Paquetes: créditos y precio (USD)
const CREDIT_PACKAGES = {
  tier300:  { credits: 300,  price: 7 },
  tier600:  { credits: 600,  price: 12 },
  tier3300: { credits: 3300, price: 50 }
};

function secondsToCredits(sec) {
  return Math.max(0, Math.ceil(Math.max(0, sec) / SECONDS_PER_CREDIT));
}

function creditsLabel(n) {
  if (currentLang === 'es') return n === 1 ? 'crédito' : 'créditos';
  return n === 1 ? 'credit' : 'credits';
}

function formatCredits(sec) {
  const n = secondsToCredits(sec);
  return `${n.toLocaleString(currentLang === 'es' ? 'es' : 'en')} ${creditsLabel(n)}`;
}

function addCredits(credits, label) {
  addCreditSeconds(credits * SECONDS_PER_CREDIT, label || `${credits} ${creditsLabel(credits)}`);
}

function saveCreditsToStorage() {
  try {
    localStorage.setItem('alexandria_credits_sec', String(userCreditsRemainingSec));
  } catch (e) {}
}

function updateCreditUI() {
  const timeStr = formatCredits(userCreditsRemainingSec);
  
  const badgeDesk = document.getElementById('creditBadgeText');
  if (badgeDesk) badgeDesk.textContent = timeStr;
  
  const badgeMob = document.getElementById('creditBadgeTextMobile');
  if (badgeMob) badgeMob.textContent = timeStr;

  const chamberDesk = document.getElementById('chamberTimerText');
  if (chamberDesk) chamberDesk.textContent = timeStr;

  const chamberMob = document.getElementById('chamberTimerTextMobile');
  if (chamberMob) chamberMob.textContent = timeStr;

  const modalBal = document.getElementById('modalCurrentBalanceText');
  if (modalBal) modalBal.textContent = timeStr;

  // Color coding based on remaining time
  const isLow = userCreditsRemainingSec <= 60 && userCreditsRemainingSec > 0;
  const isExhausted = userCreditsRemainingSec <= 0;

  const pulseRing = document.getElementById('creditPulseRing');
  const dot = document.getElementById('creditDot');
  const chPulse = document.getElementById('chamberTimerPulse');
  const chDot = document.getElementById('chamberTimerDot');

  [pulseRing, chPulse].forEach(el => {
    if (!el) return;
    el.className = isExhausted 
      ? 'hidden' 
      : (isLow ? 'animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75' 
              : 'animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75');
  });

  [dot, chDot].forEach(el => {
    if (!el) return;
    el.className = isExhausted 
      ? 'relative inline-flex rounded-full h-2 w-2 bg-gray-500' 
      : (isLow ? 'relative inline-flex rounded-full h-2 w-2 bg-rose-500 animate-pulse' 
              : 'relative inline-flex rounded-full h-2 w-2 bg-emerald-500');
  });
}

function showLowCreditWarning(show, messageText = null) {
  const banner = document.getElementById('lowCreditWarningBanner');
  if (!banner) return;
  if (show) {
    banner.classList.remove('hidden');
    if (messageText) {
      const msgEl = document.getElementById('lowCreditWarningText');
      if (msgEl) msgEl.textContent = messageText;
    }
  } else {
    banner.classList.add('hidden');
  }
}

function startSessionCreditCountdown() {
  stopSessionCreditCountdown();
  updateCreditUI();
  sessionCountdownInterval = setInterval(() => {
    if (userCreditsRemainingSec > 0) {
      userCreditsRemainingSec--;
      saveCreditsToStorage();
      updateCreditUI();

      if (userCreditsRemainingSec === 10 * SECONDS_PER_CREDIT) {
        showLowCreditWarning(true, currentLang === 'en'
          ? 'Warning: only 10 credits left. Add credits to keep talking without interruption!'
          : 'Aviso: solo te quedan 10 créditos. ¡Añade créditos para seguir conversando sin interrupción!');
        showToast(currentLang === 'en' ? '⚠️ 10 credits left.' : '⚠️ Quedan 10 créditos.');
      } else if (userCreditsRemainingSec === 5 * SECONDS_PER_CREDIT) {
        showToast(currentLang === 'en' ? '⏳ 5 credits left.' : '⏳ Quedan 5 créditos.');
      } else if (userCreditsRemainingSec <= 0) {
        stopSessionCreditCountdown();
        handleCreditsExhausted();
      }
    } else {
      stopSessionCreditCountdown();
      handleCreditsExhausted();
    }
  }, 1000);
}

function stopSessionCreditCountdown() {
  if (sessionCountdownInterval) {
    clearInterval(sessionCountdownInterval);
    sessionCountdownInterval = null;
  }
}

async function handleCreditsExhausted() {
  if (activeElevenConversation) {
    try { await activeElevenConversation.endSession(); } catch (e) {}
    activeElevenConversation = null;
  }
  stopSpeaking();
  stopVoiceRecognition();
  showLowCreditWarning(false);
  closeAgoraSession();
  openStripeModal(true);
  showToast(currentLang === 'en'
    ? 'You have run out of credits. Choose a package to keep talking with the philosophers!'
    : '¡Te quedaste sin créditos! Elige un paquete para seguir conversando con los filósofos.');
}

function openStripeModal(isExpired = false) {
  const modal = document.getElementById('stripeModal');
  if (!modal) return;
  
  const badge = document.getElementById('stripeModalBadge');
  const title = document.getElementById('stripeModalTitle');
  const subtitle = document.getElementById('stripeModalSubtitle');

  if (isExpired) {
    if (badge) badge.textContent = currentLang === 'en' ? 'Out of Credits' : 'Sin Créditos';
    if (title) title.textContent = currentLang === 'en' ? 'Your Credits Have Run Out' : 'Tus Créditos Se Han Agotado';
    if (subtitle) subtitle.textContent = currentLang === 'en'
      ? 'Choose a credit package to keep conversing with the greatest minds of all time. Secure payment with Stripe.'
      : 'Elige un paquete de créditos para seguir conversando con las mentes más grandes de todos los tiempos. Pago seguro con Stripe.';
  } else {
    if (badge) badge.textContent = currentLang === 'en' ? 'Alexandria Credits' : 'Créditos de Alexandria';
    if (title) title.textContent = currentLang === 'en' ? 'Extend Your Philosophical Dialogues' : 'Extiende tus Diálogos Filosóficos';
    if (subtitle) subtitle.textContent = currentLang === 'en'
      ? `You start with ${FREE_CREDITS} free credits. Add credits securely via Stripe to keep conversing without interruption.`
      : `Empiezas con ${FREE_CREDITS} créditos gratis. Añade créditos de forma segura con Stripe para seguir conversando sin pausa.`;
  }

  loadCustomStripeLinks();
  updateCreditUI();
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeStripeModal() {
  const modal = document.getElementById('stripeModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function addCreditSeconds(sec, label) {
  userCreditsRemainingSec = Math.max(0, userCreditsRemainingSec + sec);
  saveCreditsToStorage();
  updateCreditUI();
  showLowCreditWarning(false);
  showToast((currentLang === 'en' ? '✦ Added ' : '✦ Se añadieron ') + label + (currentLang === 'en' ? ' to your balance!' : ' a tu saldo!'));
  closeStripeModal();
}

function resetCreditsToFiveMinutes() {
  userCreditsRemainingSec = INITIAL_FREE_SECONDS;
  saveCreditsToStorage();
  updateCreditUI();
  showLowCreditWarning(false);
  showToast(currentLang === 'en' ? `Balance reset to ${FREE_CREDITS} free credits.` : `Saldo restablecido a ${FREE_CREDITS} créditos gratis.`);
  closeStripeModal();
}

function toggleStripeSettings() {
  const panel = document.getElementById('stripeSettingsPanel');
  if (panel) panel.classList.toggle('hidden');
}

function loadCustomStripeLinks() {
  try {
    Object.keys(CREDIT_PACKAGES).forEach((tier) => {
      const input = document.getElementById('stripeLink_' + tier);
      if (input) input.value = localStorage.getItem('alexandria_stripe_' + tier) || '';
    });
  } catch (e) {}
}

function saveCustomStripeLinks() {
  try {
    Object.keys(CREDIT_PACKAGES).forEach((tier) => {
      const input = document.getElementById('stripeLink_' + tier);
      if (input) localStorage.setItem('alexandria_stripe_' + tier, input.value.trim());
    });
    showToast(currentLang === 'en' ? 'Custom Stripe links saved!' : '¡Enlaces de Stripe guardados!');
  } catch (e) {}
}

function handleStripeCheckout(tierKey) {
  let customLink = '';
  try {
    customLink = localStorage.getItem('alexandria_stripe_' + tierKey) || '';
  } catch (e) {}

  if (customLink && customLink.startsWith('http')) {
    showToast(currentLang === 'en' ? 'Redirecting to secure Stripe Checkout…' : 'Redirigiendo a pasarela segura Stripe…');
    setTimeout(() => { window.location.href = customLink; }, 600);
    return;
  }

  // If no custom Stripe link is set yet, explain and offer instant simulation
  const pack = CREDIT_PACKAGES[tierKey];
  if (!pack) return;
  const isEn = currentLang === 'en';
  const promptMsg = isEn
    ? `[Stripe Checkout Configuration]\n\nTo connect live Stripe:\nPaste your Stripe Payment Link in "⚙️ Stripe Links / Promo" below.\n\nWould you like to simulate adding ${pack.credits} credits now for testing?`
    : `[Configuración de Pasarela Stripe]\n\nPara conectar tu cuenta real de Stripe:\nPega tu Payment Link en "⚙️ Stripe Links / Promo" abajo.\n\n¿Deseas simular la adición de ${pack.credits} créditos ahora para probar?`;

  if (confirm(promptMsg)) {
    addCredits(pack.credits);
  } else {
    toggleStripeSettings();
  }
}

function redeemVoucherCode() {
  const input = document.getElementById('voucherCodeInput');
  if (!input) return;
  const code = input.value.trim().toUpperCase();
  if (!code) return;

  if (code === 'SOCRATES' || code === 'ALEXANDRIA' || code === 'WISDOM' || code === 'FREE30' || code === 'DEMO') {
    input.value = '';
    addCredits(300, `300 ${creditsLabel(300)} (${code})`);
  } else {
    input.value = '';
    addCredits(150, `150 ${creditsLabel(150)} (${code})`);
  }
}

// PWA Lifecycle & Installation
let deferredPwaPrompt = null;
function initPwaServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      console.log('Alexandria PWA Service Worker registered:', reg.scope);
    }).catch((err) => {
      console.warn('Service Worker registration note:', err);
    });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPwaPrompt = e;
    document.querySelectorAll('.pwa-install-trigger').forEach(btn => btn.classList.remove('hidden'));
  });

  // If already installed as standalone
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
    document.querySelectorAll('.pwa-install-trigger').forEach(btn => btn.classList.add('hidden'));
  }
}

function triggerPwaInstall() {
  if (deferredPwaPrompt) {
    deferredPwaPrompt.prompt();
    deferredPwaPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        showToast(currentLang === 'en'
          ? 'Thank you! Alexandria is installing on your device.'
          : '¡Gracias! Alexandria se está instalando en tu dispositivo.');
      }
      deferredPwaPrompt = null;
      document.querySelectorAll('.pwa-install-trigger').forEach(btn => btn.classList.add('hidden'));
    });
  } else {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIos) {
      alert(currentLang === 'en'
        ? "To install on iPhone/iPad:\n1. Tap the Share button (⎋) at the bottom\n2. Select 'Add to Home Screen' (+)\n\nAlexandria will appear as an app icon!"
        : "Para instalar en iPhone/iPad:\n1. Toca el botón Compartir (⎋) abajo\n2. Selecciona 'Agregar a pantalla de inicio' (+)\n\n¡Alexandria aparecerá como una app en tu pantalla!");
    } else {
      showToast(currentLang === 'en'
        ? "To install: Tap the browser menu (⋮) and select 'Install Alexandria' or 'Add to Home Screen'."
        : "Para instalar: Abre el menú del navegador (⋮) y selecciona 'Instalar aplicación' o 'Agregar a la pantalla principal'.");
    }
  }
}

function initCreditSystem() {
  try {
    const stored = localStorage.getItem('alexandria_credits_sec');
    if (stored !== null && !isNaN(parseInt(stored, 10))) {
      userCreditsRemainingSec = parseInt(stored, 10);
    } else {
      userCreditsRemainingSec = INITIAL_FREE_SECONDS;
      saveCreditsToStorage();
    }
  } catch (e) {
    userCreditsRemainingSec = INITIAL_FREE_SECONDS;
  }

  // Regreso de Stripe: ?stripe_success=true&credits=600
  try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('stripe_success') === 'true') {
      const credits = parseInt(urlParams.get('credits') || '600', 10);
      addCredits(credits);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  } catch (e) {}

  updateCreditUI();
}

// =========================================================================
// 8. ONDAS EN VIVO (se mueven con tu voz y con la del filósofo)
// =========================================================================
let waveLevelsRaf = null;
let waveLevel = 0;
let micMeter = null; // { stream, ctx, analyser, data }
let micMeterWanted = false;
let micMeterStarting = false;

// Medidor de tu micrófono: se usa en el dictado por voz y en las llamadas de ElevenLabs
async function startMicMeter() {
  micMeterWanted = true;
  if (micMeter || micMeterStarting || !navigator.mediaDevices?.getUserMedia) return;
  micMeterStarting = true;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true }
    });
    if (!micMeterWanted) { stream.getTracks().forEach(t => t.stop()); return; }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    ctx.createMediaStreamSource(stream).connect(analyser);
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    micMeter = { stream, ctx, analyser, data: new Uint8Array(analyser.fftSize) };
  } catch (e) {
    micMeter = null; // sin permiso: las ondas usan la animación normal
  } finally {
    micMeterStarting = false;
  }
}

function stopMicMeter() {
  micMeterWanted = false;
  if (!micMeter) return;
  try { micMeter.stream.getTracks().forEach(t => t.stop()); } catch (e) {}
  try { micMeter.ctx.close(); } catch (e) {}
  micMeter = null;
}

function readMicLevel() {
  if (!micMeter) return 0;
  micMeter.analyser.getByteTimeDomainData(micMeter.data);
  let sum = 0;
  for (let i = 0; i < micMeter.data.length; i++) {
    const v = (micMeter.data[i] - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / micMeter.data.length);
}

// Devuelve el volumen actual (0..1) o null si no hay una fuente de audio real
function getLiveVoiceLevel() {
  const conv = activeElevenConversation;
  if (conv) {
    let input = 0, output = 0;
    try { if (typeof conv.getInputVolume === 'function') input = conv.getInputVolume() || 0; } catch (e) {}
    try { if (typeof conv.getOutputVolume === 'function') output = conv.getOutputVolume() || 0; } catch (e) {}
    return Math.max(input, output, readMicLevel());
  }
  if (micMeter) return readMicLevel();
  return null;
}

function startWaveLevelsLoop() {
  stopWaveLevelsLoop();
  const waveform = document.getElementById('waveformContainer');
  const bars = waveform ? Array.from(waveform.querySelectorAll('.n-wave-bar')) : [];
  const shape = [0.45, 0.7, 0.9, 1, 0.85, 1, 0.9, 0.7, 0.45];

  const tick = (now) => {
    const raw = getLiveVoiceLevel();
    if (raw === null) {
      // Sin audio real (voz del navegador): se usa la animación de siempre
      if (waveform.classList.contains('live-levels')) {
        waveform.classList.remove('live-levels');
        bars.forEach(b => { b.style.height = ''; b.style.opacity = ''; });
      }
    } else {
      waveform.classList.add('live-levels');
      const target = Math.pow(Math.min(1, Math.max(0, (raw - 0.006) * 10)), 0.6);
      waveLevel += (target - waveLevel) * (target > waveLevel ? 0.6 : 0.2);
      const t = now / 1000;
      bars.forEach((b, i) => {
        const wobble = 0.65 + 0.35 * Math.sin(t * 9 + i * 1.7);
        const h = 5 + 21 * waveLevel * shape[i % shape.length] * wobble;
        b.style.height = h.toFixed(1) + 'px';
        b.style.opacity = (0.38 + 0.62 * Math.min(1, waveLevel * 1.4)).toFixed(2);
      });
    }
    waveLevelsRaf = requestAnimationFrame(tick);
  };
  if (bars.length) waveLevelsRaf = requestAnimationFrame(tick);
}

function stopWaveLevelsLoop() {
  if (waveLevelsRaf) cancelAnimationFrame(waveLevelsRaf);
  waveLevelsRaf = null;
  waveLevel = 0;
  const waveform = document.getElementById('waveformContainer');
  if (waveform) {
    waveform.classList.remove('live-levels');
    waveform.querySelectorAll('.n-wave-bar').forEach(b => { b.style.height = ''; b.style.opacity = ''; });
  }
}

// =========================================================================
// 9. BARRA SUPERIOR FLOTANTE
// =========================================================================
(function initFloatingNav() {
  const update = () => {
    const bar = document.getElementById('siteHeaderBar');
    if (bar) bar.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('DOMContentLoaded', update);
})();

// =========================================================================
// 10. VIDEOS DE LAS TARJETAS (en bucle; se pausan fuera de pantalla y con el chat abierto)
// =========================================================================
let cardVideosPaused = false;
let cardVideoObserver = null;

function updateCardVideoPlayback(video) {
  const shouldPlay = !cardVideosPaused && video.dataset.onScreen === '1';
  if (shouldPlay) {
    if (video.preload !== 'auto') { video.preload = 'auto'; video.load(); }
    const p = video.play();
    if (p && p.catch) p.catch(() => {});
  } else if (!video.paused) {
    video.pause();
  }
}

function setupCardVideos() {
  if (cardVideoObserver) cardVideoObserver.disconnect();
  cardVideoObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          e.target.dataset.onScreen = e.isIntersecting ? '1' : '0';
          updateCardVideoPlayback(e.target);
        });
      })
    : null;
  document.querySelectorAll('#philosophersGrid .card-video').forEach((v) => {
    v.muted = true; // necesario para que el navegador permita la reproducción automática
    // Arranca de inmediato; el observador solo lo pausa cuando sale de la pantalla
    v.dataset.onScreen = '1';
    if (cardVideoObserver) cardVideoObserver.observe(v);
    updateCardVideoPlayback(v);
  });
}

function setCardVideosPaused(paused) {
  cardVideosPaused = paused;
  document.querySelectorAll('#philosophersGrid .card-video').forEach(updateCardVideoPlayback);
}
