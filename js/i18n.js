/*
 * Tiny i18n layer: a flat dot-path dictionary per locale (en/es/pt/ja) plus a
 * t(key, vars) lookup that falls back to English if a key is missing. No
 * build step, no framework - just a global `I18N` used by the other scripts.
 */
(function (global) {
  "use strict";

  var LOCALES = ["en", "es", "pt", "ja"];
  var DEFAULT_LOCALE = "en";
  var STORAGE_KEY = "abyssboard-lang";

  var DICT = {
    en: {
      meta: {
        title: "AbyssBoard — Find Your Perfect Surfboard",
        description: "Get a personalised surfboard shape, length, width and volume recommendation based on your wave size, style, level and build — with a visual size comparison against your own silhouette."
      },
      brand: { tagline: "Find the surfboard shape & length built for you — glowing up from the depths." },
      aria: {
        units: "Units",
        language: "Language",
        heightSlider: "Height slider",
        weightSlider: "Weight slider"
      },
      input: { heading: "Tell us about you" },
      field: {
        height: "Height",
        weight: "Weight",
        waveSize: "Wave size you ride most",
        style: "Your style",
        level: "Your level",
        material: "Board material",
        fitness: "Paddle fitness & how often you surf"
      },
      results: { heading: "Your recommendation" },
      volume: {
        label: "Target volume",
        hint: "Litres of foam — the single most important number when picking a board"
      },
      badge: { recommended: "Recommended for you", alternative: "Also worth a look" },
      stat: { length: "Length", width: "Width", thickness: "Thickness", volume: "Volume", tailSuffix: "{{tail}} tail" },
      tail: { round: "Round", squash: "Squash", swallow: "Swallow", pin: "Pin" },
      material: {
        pu: { label: "PU / Polyester", blurb: "classic flex, cheaper repairs" },
        epoxy: { label: "Epoxy / EPS", blurb: "lighter, floatier, tougher" },
        either: { label: "No preference", blurb: "recommend what fits best" }
      },
      fitness: {
        low: { label: "Just starting out", blurb: "occasional sessions" },
        average: { label: "Regular surfer", blurb: "a few times a month" },
        high: { label: "Surf-fit & frequent", blurb: "paddle-fit, surf often" }
      },
      waveSize: {
        small: { label: "Small & mushy", blurb: "Knee – waist high (1–3 ft)" },
        medium: { label: "Medium & punchy", blurb: "Chest – head high (3–5 ft)" },
        large: { label: "Large & powerful", blurb: "Head – overhead (5–7 ft)" },
        xlarge: { label: "Big wave", blurb: "Well overhead (7 ft+)" }
      },
      style: {
        fun: { label: "Fun & cruisy", blurb: "glide, trim, easy speed" },
        technical: { label: "Technical / carving", blurb: "rail-to-rail, drawn-out lines" },
        aggressive: { label: "Aggressive / performance", blurb: "vertical, high-speed, air" },
        classic: { label: "Classic / noserider", blurb: "trim, footwork, cross-stepping" }
      },
      level: {
        beginner: { label: "Beginner", blurb: "still learning to catch waves & pop up" },
        intermediate: { label: "Intermediate", blurb: "linking turns, comfortable paddling out" },
        advanced: { label: "Advanced", blurb: "confident in varied conditions, generating speed" },
        expert: { label: "Expert / competitive", blurb: "high performance, seeks specific tools" }
      },
      archetype: {
        softtop: {
          name: "Beginner Soft-Top",
          tagline: "Stable, forgiving, built to catch you your first hundred waves",
          description: "A wide, thick, soft-decked board designed purely for stability, paddle power and safety while you learn to catch waves and pop up."
        },
        funboard: {
          name: "Funboard / Mini-Mal",
          tagline: "The all-rounder bridge between longboard glide and shortboard feel",
          description: "Extra length and volume for effortless paddling and wave-catching, with enough outline curve to still turn and have fun once you're up."
        },
        fish: {
          name: "Fish",
          tagline: "Wide, flat, fast — built to generate speed in weak surf",
          description: "A short, wide swallow-tail outline with a flatter rocker that plane early and carry speed through the flat, mushy sections of small waves."
        },
        groveler: {
          name: "Performance Groveler",
          tagline: "A high-volume shortboard for making the most of small days",
          description: "A stubbier, thicker, higher-volume shortboard that still lets you surf aggressively and vertically even when the swell is small and soft."
        },
        shortboard: {
          name: "Performance Shortboard",
          tagline: "The high-performance standard for driving turns and vertical surfing",
          description: "A narrow, curvy, low-volume outline that rewards speed and commitment — built for tight arcs, rail-to-rail surfing and quick direction changes."
        },
        stepup: {
          name: "Step-Up",
          tagline: "Extra length and control for when the swell jumps in size",
          description: "Between a shortboard and a gun: enough extra length and foam to paddle into faster, more powerful waves while keeping a performance-oriented outline."
        },
        gun: {
          name: "Big Wave Gun",
          tagline: "Long, narrow and pointed for paddling into serious size",
          description: "A long, pulled-in, pintail board built to paddle fast enough to catch large, fast-moving faces and hold a line at speed down the line."
        },
        longboard: {
          name: "Longboard",
          tagline: "Effortless glide, trim and classic nose-riding style",
          description: "Long and full-volume with a gently curved outline, built for paddle power, early wave entry, smooth trim lines and walking the board."
        }
      },
      materialNote: {
        beginnerPu: "As a beginner, an epoxy/soft-top construction will float better, paddle easier and ding far less than traditional PU — worth considering even though PU is a fine, more affordable choice too.",
        epoxy: "Epoxy/EPS construction floats a little higher, so we've trimmed the target volume slightly versus an equivalent PU board."
      },
      silhouette: {
        heading: "Size check: you vs. the board",
        you: "You —",
        board: "Board (top view) —",
        ariaLabel: "Silhouette comparing the surfer's height to the recommended board's length and width"
      },
      footer: {
        text: "Estimates only, based on widely-used surfboard volume and sizing guidelines (Guild-factor volume formula, typical length/width/thickness ratios per board type). Every shaper's outline differs — use this as a starting point and fine-tune with your local surf shop or shaper.",
        developedBy: "Developed by"
      },
      buy: {
        heading: "Where to buy",
        region: "Shopping region",
        maps: "Surf shops near you",
        search: "Search online",
        amazon: "Amazon",
        query: "{{board}} surfboard",
        mapsQuery: "surf shop",
        disclaimer: "Generic search links, not verified endorsements — availability, price and shipping vary by seller."
      }
    },

    es: {
      meta: {
        title: "AbyssBoard — Encuentra tu tabla de surf perfecta",
        description: "Obtén una recomendación personalizada de forma, largo, ancho y volumen de tabla según tu tamaño de ola, estilo, nivel y contextura — con una comparación visual de tamaño contra tu propia silueta."
      },
      brand: { tagline: "Encuentra la forma y el largo de tabla hechos para ti — brillando desde las profundidades." },
      aria: {
        units: "Unidades",
        language: "Idioma",
        heightSlider: "Control deslizante de altura",
        weightSlider: "Control deslizante de peso"
      },
      input: { heading: "Cuéntanos sobre ti" },
      field: {
        height: "Altura",
        weight: "Peso",
        waveSize: "Tamaño de ola que sueles surfear",
        style: "Tu estilo",
        level: "Tu nivel",
        material: "Material de la tabla",
        fitness: "Tu condición para remar y con qué frecuencia surfeas"
      },
      results: { heading: "Tu recomendación" },
      volume: {
        label: "Volumen objetivo",
        hint: "Litros de espuma — el número más importante a la hora de elegir tabla"
      },
      badge: { recommended: "Recomendada para ti", alternative: "También vale la pena mirar" },
      stat: { length: "Largo", width: "Ancho", thickness: "Grosor", volume: "Volumen", tailSuffix: "Cola {{tail}}" },
      tail: { round: "redonda", squash: "squash", swallow: "golondrina", pin: "pin" },
      material: {
        pu: { label: "PU / Poliéster", blurb: "flex clásico, reparaciones más baratas" },
        epoxy: { label: "Epoxy / EPS", blurb: "más ligera, más flotabilidad, más resistente" },
        either: { label: "Sin preferencia", blurb: "recomienda lo que mejor se adapte" }
      },
      fitness: {
        low: { label: "Recién empezando", blurb: "sesiones ocasionales" },
        average: { label: "Surfista habitual", blurb: "algunas veces al mes" },
        high: { label: "En forma y frecuente", blurb: "buena forma para remar, surfea seguido" }
      },
      waveSize: {
        small: { label: "Pequeña y blanda", blurb: "Rodilla – cintura (1–3 pies)" },
        medium: { label: "Media y con fuerza", blurb: "Pecho – cabeza (3–5 pies)" },
        large: { label: "Grande y potente", blurb: "Cabeza – por encima (5–7 pies)" },
        xlarge: { label: "Ola grande", blurb: "Muy por encima (7+ pies)" }
      },
      style: {
        fun: { label: "Divertido y relajado", blurb: "deslizar, trim, velocidad fácil" },
        technical: { label: "Técnico / carving", blurb: "de rail a rail, líneas largas" },
        aggressive: { label: "Agresivo / performance", blurb: "vertical, alta velocidad, aéreos" },
        classic: { label: "Clásico / noserider", blurb: "trim, juego de pies, cross-stepping" }
      },
      level: {
        beginner: { label: "Principiante", blurb: "todavía aprendiendo a tomar olas y pararse" },
        intermediate: { label: "Intermedio", blurb: "encadenando giros, cómodo remando hacia afuera" },
        advanced: { label: "Avanzado", blurb: "seguro en condiciones variadas, generando velocidad" },
        expert: { label: "Experto / competitivo", blurb: "alto rendimiento, busca herramientas específicas" }
      },
      archetype: {
        softtop: {
          name: "Soft-Top para principiantes",
          tagline: "Estable, permisiva, hecha para acompañarte en tus primeras cien olas",
          description: "Una tabla ancha, gruesa y de cubierta blanda, diseñada puramente para la estabilidad, la fuerza de remada y la seguridad mientras aprendes a tomar olas y pararte."
        },
        funboard: {
          name: "Funboard / Mini-Mal",
          tagline: "La todoterreno que conecta el deslizamiento del longboard con la sensación del shortboard",
          description: "Largo y volumen extra para remar y tomar olas sin esfuerzo, con suficiente curva en el contorno para seguir girando y divirtiéndote una vez de pie."
        },
        fish: {
          name: "Fish",
          tagline: "Ancha, plana y rápida — hecha para generar velocidad en olas débiles",
          description: "Un contorno corto y ancho con cola golondrina y un rocker más plano que planea temprano y mantiene la velocidad en los tramos planos y blandos de olas pequeñas."
        },
        groveler: {
          name: "Groveler de Performance",
          tagline: "Un shortboard de alto volumen para aprovechar al máximo los días de olas pequeñas",
          description: "Un shortboard más corto, más grueso y de mayor volumen que aun así te permite surfear de forma agresiva y vertical incluso cuando el swell es pequeño y suave."
        },
        shortboard: {
          name: "Shortboard de Performance",
          tagline: "El estándar de alto rendimiento para giros potentes y surf vertical",
          description: "Un contorno angosto, curvo y de bajo volumen que premia la velocidad y el compromiso — hecho para arcos cerrados, surf de rail a rail y cambios de dirección rápidos."
        },
        stepup: {
          name: "Step-Up",
          tagline: "Largo y control extra para cuando el swell sube de tamaño",
          description: "Entre un shortboard y un gun: suficiente largo y espuma extra para remar hacia olas más rápidas y potentes, manteniendo un contorno orientado a la performance."
        },
        gun: {
          name: "Gun de Olas Grandes",
          tagline: "Larga, angosta y puntiaguda para remar hacia olas de tamaño serio",
          description: "Una tabla larga, de contorno cerrado y cola pin, hecha para remar lo suficientemente rápido como para tomar caras grandes y rápidas y mantener la línea a alta velocidad."
        },
        longboard: {
          name: "Longboard",
          tagline: "Deslizamiento sin esfuerzo, trim y el estilo clásico de noseriding",
          description: "Larga y de volumen completo, con un contorno suavemente curvado, hecha para la fuerza de remada, entrada temprana en la ola, líneas de trim suaves y caminar sobre la tabla."
        }
      },
      materialNote: {
        beginnerPu: "Como principiante, una construcción epoxy/soft-top flotará mejor, será más fácil de remar y se dañará mucho menos que un PU tradicional — vale la pena considerarla, aunque el PU también es una opción válida y más económica.",
        epoxy: "La construcción epoxy/EPS flota un poco más, así que hemos reducido ligeramente el volumen objetivo respecto a una tabla de PU equivalente."
      },
      silhouette: {
        heading: "Chequeo de tamaño: tú vs. la tabla",
        you: "Tú —",
        board: "Tabla (vista superior) —",
        ariaLabel: "Silueta que compara la altura del surfista con el largo y ancho de la tabla recomendada"
      },
      footer: {
        text: "Solo son estimaciones, basadas en pautas de volumen y medidas de tablas ampliamente utilizadas (fórmula de volumen Guild-factor, proporciones típicas de largo/ancho/grosor según el tipo de tabla). El contorno de cada shaper es distinto — usa esto como punto de partida y afina los detalles con tu tienda de surf o shaper local.",
        developedBy: "Desarrollado por"
      },
      buy: {
        heading: "Dónde comprar",
        region: "Región de compra",
        maps: "Tiendas de surf cerca de ti",
        search: "Buscar online",
        amazon: "Amazon",
        query: "tabla de surf {{board}}",
        mapsQuery: "tienda de surf",
        disclaimer: "Enlaces de búsqueda genéricos, no son recomendaciones verificadas — la disponibilidad, el precio y el envío varían según la tienda."
      }
    },

    pt: {
      meta: {
        title: "AbyssBoard — Encontre sua prancha de surf perfeita",
        description: "Receba uma recomendação personalizada de shape, comprimento, largura e volume de prancha com base no tamanho da onda, estilo, nível e biotipo — com uma comparação visual de tamanho com a sua própria silhueta."
      },
      brand: { tagline: "Encontre o shape e o comprimento de prancha feitos para você — brilhando desde as profundezas." },
      aria: {
        units: "Unidades",
        language: "Idioma",
        heightSlider: "Controle deslizante de altura",
        weightSlider: "Controle deslizante de peso"
      },
      input: { heading: "Conte-nos sobre você" },
      field: {
        height: "Altura",
        weight: "Peso",
        waveSize: "Tamanho de onda que você mais surfa",
        style: "Seu estilo",
        level: "Seu nível",
        material: "Material da prancha",
        fitness: "Seu condicionamento para remar e a frequência que surfa"
      },
      results: { heading: "Sua recomendação" },
      volume: {
        label: "Volume alvo",
        hint: "Litros de espuma — o número mais importante na hora de escolher uma prancha"
      },
      badge: { recommended: "Recomendada para você", alternative: "Também vale a pena conferir" },
      stat: { length: "Comprimento", width: "Largura", thickness: "Espessura", volume: "Volume", tailSuffix: "Rabeta {{tail}}" },
      tail: { round: "Redonda", squash: "Squash", swallow: "Andorinha", pin: "Pin" },
      material: {
        pu: { label: "PU / Poliéster", blurb: "flex clássico, reparos mais baratos" },
        epoxy: { label: "Epóxi / EPS", blurb: "mais leve, mais flutuação, mais resistente" },
        either: { label: "Sem preferência", blurb: "recomende o que for mais adequado" }
      },
      fitness: {
        low: { label: "Começando agora", blurb: "sessões ocasionais" },
        average: { label: "Surfista regular", blurb: "algumas vezes por mês" },
        high: { label: "Em forma e frequente", blurb: "bom condicionamento, surfa bastante" }
      },
      waveSize: {
        small: { label: "Pequena e mole", blurb: "Joelho – cintura (1–3 pés)" },
        medium: { label: "Média e com força", blurb: "Peito – cabeça (3–5 pés)" },
        large: { label: "Grande e potente", blurb: "Cabeça – acima da cabeça (5–7 pés)" },
        xlarge: { label: "Onda grande", blurb: "Bem acima da cabeça (7+ pés)" }
      },
      style: {
        fun: { label: "Divertido e tranquilo", blurb: "deslize, trim, velocidade fácil" },
        technical: { label: "Técnico / carving", blurb: "de rail a rail, linhas longas" },
        aggressive: { label: "Agressivo / performance", blurb: "vertical, alta velocidade, aéreos" },
        classic: { label: "Clássico / noserider", blurb: "trim, jogo de pés, cross-stepping" }
      },
      level: {
        beginner: { label: "Iniciante", blurb: "ainda aprendendo a pegar ondas e levantar" },
        intermediate: { label: "Intermediário", blurb: "encadeando manobras, confortável remando para fora" },
        advanced: { label: "Avançado", blurb: "confiante em condições variadas, gerando velocidade" },
        expert: { label: "Especialista / competitivo", blurb: "alta performance, busca equipamentos específicos" }
      },
      archetype: {
        softtop: {
          name: "Soft-Top para iniciantes",
          tagline: "Estável, tolerante, feita para te acompanhar nas primeiras cem ondas",
          description: "Uma prancha larga, grossa e com deck macio, projetada puramente para estabilidade, força de remada e segurança enquanto você aprende a pegar ondas e levantar."
        },
        funboard: {
          name: "Funboard / Mini-Mal",
          tagline: "A versátil que une o deslize do longboard com a sensação do shortboard",
          description: "Comprimento e volume extras para remar e pegar ondas sem esforço, com curva de contorno suficiente para ainda girar e se divertir depois de levantar."
        },
        fish: {
          name: "Fish",
          tagline: "Larga, plana e rápida — feita para gerar velocidade em ondas fracas",
          description: "Um contorno curto e largo com rabeta andorinha e um rocker mais plano, que plana cedo e mantém a velocidade nos trechos planos e moles de ondas pequenas."
        },
        groveler: {
          name: "Groveler de Performance",
          tagline: "Um shortboard de alto volume para aproveitar ao máximo os dias de ondas pequenas",
          description: "Um shortboard mais curto, mais grosso e de maior volume que ainda assim permite surfar de forma agressiva e vertical mesmo quando o swell está pequeno e mole."
        },
        shortboard: {
          name: "Shortboard de Performance",
          tagline: "O padrão de alta performance para manobras potentes e surf vertical",
          description: "Um contorno estreito, curvo e de baixo volume que recompensa velocidade e comprometimento — feito para arcos fechados, surf de rail a rail e mudanças de direção rápidas."
        },
        stepup: {
          name: "Step-Up",
          tagline: "Comprimento e controle extras para quando o swell aumenta de tamanho",
          description: "Entre um shortboard e um gun: comprimento e espuma extras o suficiente para remar em ondas mais rápidas e potentes, mantendo um contorno voltado à performance."
        },
        gun: {
          name: "Gun de Ondas Grandes",
          tagline: "Longa, estreita e pontiaguda para remar em ondas de tamanho sério",
          description: "Uma prancha longa, com contorno fechado e rabeta pin, feita para remar rápido o suficiente para pegar paredes grandes e rápidas e manter a linha em alta velocidade."
        },
        longboard: {
          name: "Longboard",
          tagline: "Deslize sem esforço, trim e o estilo clássico de noseriding",
          description: "Longa e de volume total, com um contorno suavemente curvado, feita para força de remada, entrada precoce na onda, linhas de trim suaves e caminhar sobre a prancha."
        }
      },
      materialNote: {
        beginnerPu: "Como iniciante, uma construção epóxi/soft-top vai flutuar melhor, ser mais fácil de remar e sofrer bem menos avarias do que o PU tradicional — vale a pena considerar, embora o PU também seja uma opção válida e mais econômica.",
        epoxy: "A construção epóxi/EPS flutua um pouco mais, então reduzimos levemente o volume alvo em relação a uma prancha de PU equivalente."
      },
      silhouette: {
        heading: "Checagem de tamanho: você vs. a prancha",
        you: "Você —",
        board: "Prancha (vista superior) —",
        ariaLabel: "Silhueta que compara a altura do surfista com o comprimento e a largura da prancha recomendada"
      },
      footer: {
        text: "Apenas estimativas, baseadas em diretrizes de volume e dimensionamento de pranchas amplamente utilizadas (fórmula de volume Guild-factor, proporções típicas de comprimento/largura/espessura por tipo de prancha). O contorno de cada shaper é diferente — use isto como ponto de partida e ajuste os detalhes com sua loja de surf ou shaper local.",
        developedBy: "Desenvolvido por"
      },
      buy: {
        heading: "Onde comprar",
        region: "Região de compra",
        maps: "Lojas de surf perto de você",
        search: "Buscar online",
        amazon: "Amazon",
        query: "prancha de surf {{board}}",
        mapsQuery: "loja de surf",
        disclaimer: "Links de busca genéricos, não são recomendações verificadas — disponibilidade, preço e frete variam por loja."
      }
    },

    ja: {
      meta: {
        title: "AbyssBoard — あなたにぴったりのサーフボードを見つける",
        description: "波のサイズ、スタイル、レベル、体格をもとに、あなたに合ったサーフボードの形状・長さ・幅・容量をパーソナライズして提案します。自分のシルエットとのサイズ比較もできます。"
      },
      brand: { tagline: "深海から輝くように — あなたにぴったりのボードの形とレングスを見つけよう。" },
      aria: {
        units: "単位",
        language: "言語",
        heightSlider: "身長スライダー",
        weightSlider: "体重スライダー"
      },
      input: { heading: "あなたについて教えてください" },
      field: {
        height: "身長",
        weight: "体重",
        waveSize: "よく乗る波のサイズ",
        style: "あなたのスタイル",
        level: "あなたのレベル",
        material: "ボードの素材",
        fitness: "パドル体力とサーフィンの頻度"
      },
      results: { heading: "あなたへのおすすめ" },
      volume: {
        label: "目標容量",
        hint: "リッター数(容量) — ボード選びで最も重要な数値です"
      },
      badge: { recommended: "あなたへのおすすめ", alternative: "こちらもおすすめ" },
      stat: { length: "長さ", width: "幅", thickness: "厚み", volume: "容量", tailSuffix: "{{tail}}テール" },
      tail: { round: "ラウンド", squash: "スクワッシュ", swallow: "スワロー", pin: "ピン" },
      material: {
        pu: { label: "PU(ポリエステル)", blurb: "クラシックなしなり、修理費が安い" },
        epoxy: { label: "エポキシ / EPS", blurb: "軽くて浮力が高く、丈夫" },
        either: { label: "特にこだわらない", blurb: "最適なものをおすすめしてもらう" }
      },
      fitness: {
        low: { label: "始めたばかり", blurb: "たまにセッションする程度" },
        average: { label: "普通のサーファー", blurb: "月に数回" },
        high: { label: "体力があり頻繁に乗る", blurb: "パドル体力があり、よく海に入る" }
      },
      waveSize: {
        small: { label: "小さく緩い波", blurb: "膝〜腰くらい (1–3 ft)" },
        medium: { label: "中サイズでパンチのある波", blurb: "胸〜頭くらい (3–5 ft)" },
        large: { label: "大きくパワフルな波", blurb: "頭〜オーバーヘッド (5–7 ft)" },
        xlarge: { label: "ビッグウェーブ", blurb: "完全にオーバーヘッド (7 ft以上)" }
      },
      style: {
        fun: { label: "楽しく気軽に", blurb: "グライド、トリム、楽に出すスピード" },
        technical: { label: "テクニカル / カービング", blurb: "レールtoレール、伸びのあるライン" },
        aggressive: { label: "アグレッシブ / パフォーマンス", blurb: "バーティカル、ハイスピード、エアー" },
        classic: { label: "クラシック / ノーズライダー", blurb: "トリム、フットワーク、クロスステップ" }
      },
      level: {
        beginner: { label: "初心者", blurb: "波に乗ってポップアップする練習中" },
        intermediate: { label: "中級者", blurb: "ターンをつなげられ、沖へのパドルも快適" },
        advanced: { label: "上級者", blurb: "様々なコンディションで自信を持ちスピードを生み出せる" },
        expert: { label: "エキスパート / 競技志向", blurb: "ハイパフォーマンスを求め、特定の道具を必要とする" }
      },
      archetype: {
        softtop: {
          name: "初心者用ソフトトップ",
          tagline: "安定していて扱いやすく、最初の100本の波をキャッチするためのボード",
          description: "幅広で厚みがあり、デッキが柔らかいボード。波をキャッチしてポップアップする練習をする間の安定性・パドルパワー・安全性だけを追求した設計。"
        },
        funboard: {
          name: "ファンボード / ミニマル",
          tagline: "ロングボードの滑走感とショートボードの操作感を橋渡しするオールラウンダー",
          description: "楽にパドリングして波をキャッチできる長さとボリュームがありながら、立ち上がった後も十分ターンして楽しめるアウトラインカーブを持つ。"
        },
        fish: {
          name: "フィッシュ",
          tagline: "幅広でフラット、そしてスピーディー — パワーのない波でスピードを生み出すために作られた",
          description: "短く幅広のスワローテールのアウトラインとフラットなロッカーで早い段階から滑走し、小波のフラットで力のないセクションでもスピードを保つ。"
        },
        groveler: {
          name: "パフォーマンス・グロベラー",
          tagline: "波の小さい日を最大限楽しむためのハイボリュームショートボード",
          description: "ずんぐりして厚みがあり、ボリュームの高いショートボードでありながら、うねりが小さく力のない日でもアグレッシブでバーティカルなサーフィンができる。"
        },
        shortboard: {
          name: "パフォーマンス・ショートボード",
          tagline: "力強いターンとバーティカルサーフィンのためのハイパフォーマンス標準機",
          description: "細くカーブがありボリュームの低いアウトラインで、スピードとコミットメントに応えてくれる。タイトな弧を描くターン、レールtoレールのサーフィン、素早い方向転換のために作られている。"
        },
        stepup: {
          name: "ステップアップ",
          tagline: "うねりのサイズが上がったときのための、余分な長さとコントロール性",
          description: "ショートボードとガンの中間。パフォーマンス志向のアウトラインを保ちながら、より速くパワフルな波に間に合うようパドルするための余分な長さと浮力を備える。"
        },
        gun: {
          name: "ビッグウェーブガン",
          tagline: "本格的なサイズの波に間に合うよう、長く細くとがった形状",
          description: "長くタイトに絞り込まれたピンテールのボードで、大きく速いフェイスをキャッチしスピードに乗ってラインをホールドできるだけのパドル力を持つ。"
        },
        longboard: {
          name: "ロングボード",
          tagline: "楽な滑走感、トリム、そしてクラシックなノーズライディングスタイル",
          description: "長くフルボリュームで、ゆるやかにカーブしたアウトラインを持つ。パドルパワー、早めのテイクオフ、滑らかなトリムライン、そしてボードの上を歩くことのために作られている。"
        }
      },
      materialNote: {
        beginnerPu: "初心者の場合、エポキシ/ソフトトップ構造の方が浮力が高く、パドルもしやすく、従来のPUよりもデントがずっと少なくなります。PUも十分良く、より手頃な選択肢ですが、検討する価値があります。",
        epoxy: "エポキシ/EPS構造は浮力がやや高いため、同等のPUボードに比べて目標容量を少し減らしています。"
      },
      silhouette: {
        heading: "サイズ比較: あなた vs ボード",
        you: "あなた —",
        board: "ボード(上面図) —",
        ariaLabel: "サーファーの身長とおすすめボードの長さ・幅を比較したシルエット"
      },
      footer: {
        text: "これはあくまで目安であり、広く使われているサーフボードの容量・サイズガイドライン(Guild-factorボリューム式、ボードタイプ別の一般的な長さ/幅/厚みの比率)に基づいています。シェイパーによってアウトラインは異なります — これを出発点とし、地元のサーフショップやシェイパーと相談して調整してください。",
        developedBy: "開発:"
      },
      buy: {
        heading: "購入先",
        region: "ショッピング地域",
        maps: "近くのサーフショップ",
        search: "オンラインで検索",
        amazon: "Amazon",
        query: "{{board}} サーフボード",
        mapsQuery: "サーフショップ",
        disclaimer: "これらは一般的な検索リンクであり、検証済みのおすすめではありません — 在庫・価格・配送は販売店により異なります。"
      }
    }
  };

  var currentLocale = DEFAULT_LOCALE;

  function detectLocale() {
    try {
      var saved = global.localStorage && global.localStorage.getItem(STORAGE_KEY);
      if (saved && LOCALES.indexOf(saved) !== -1) return saved;
    } catch (e) {
      // localStorage unavailable (privacy mode, etc.) - ignore and fall through
    }
    var nav = (global.navigator && (global.navigator.language || global.navigator.userLanguage)) || "";
    var short = nav.slice(0, 2).toLowerCase();
    if (LOCALES.indexOf(short) !== -1) return short;
    return DEFAULT_LOCALE;
  }

  function lookup(dict, dotPath) {
    var node = dict;
    var parts = dotPath.split(".");
    for (var i = 0; i < parts.length; i++) {
      if (node == null) return undefined;
      node = node[parts[i]];
    }
    return node;
  }

  function t(dotPath, vars) {
    var value = lookup(DICT[currentLocale], dotPath);
    if (typeof value !== "string") value = lookup(DICT[DEFAULT_LOCALE], dotPath);
    if (typeof value !== "string") return dotPath;
    if (vars) {
      Object.keys(vars).forEach(function (key) {
        value = value.split("{{" + key + "}}").join(vars[key]);
      });
    }
    return value;
  }

  function setLocale(locale) {
    if (LOCALES.indexOf(locale) === -1) return;
    currentLocale = locale;
    try {
      global.localStorage && global.localStorage.setItem(STORAGE_KEY, locale);
    } catch (e) {
      // ignore write failures
    }
  }

  function getLocale() {
    return currentLocale;
  }

  currentLocale = detectLocale();

  global.I18N = {
    LOCALES: LOCALES,
    DEFAULT_LOCALE: DEFAULT_LOCALE,
    t: t,
    setLocale: setLocale,
    getLocale: getLocale
  };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = global.I18N;
  }
})(typeof window !== "undefined" ? window : globalThis);
