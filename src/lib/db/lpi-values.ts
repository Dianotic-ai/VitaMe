// file: src/lib/db/lpi-values.ts — 由 scripts/bakeLpi.ts 生成；勿手改
//
// 源: Linus Pauling Institute Micronutrient Information Center
// 采集日: 2026-04-20
// 入库条目: 30

import 'server-only';
import type { SourceRef } from '@/lib/types/sourceRef';

export interface LpiEntry {
  ingredientId: string;
  summaryZh: {
    functionBrief: string;
    deficiencySymptoms: readonly string[];
    excessRisks: readonly string[];
  };
  summaryEn: {
    functionBrief: string;
    deficiencySymptoms: readonly string[];
    excessRisks: readonly string[];
  };
  sourceRef: SourceRef;
}

export const LPI_VALUES: readonly LpiEntry[] = [
  {
    ingredientId: "biotin",
    summaryZh: {
      functionBrief: "它是能量代谢的“小助手”，帮身体把食物变成能量，对皮肤、头发和指甲健康也很重要。",
      deficiencySymptoms: ["掉头发","脸上起红疹子","总觉得没精神","手脚刺痛"],
      excessRisks: ["安全性很高","吃太多可能会让一些化验结果不太准"],
    },
    summaryEn: {
      functionBrief: "Acts as a cofactor for enzymes involved in fatty acid synthesis, glucose production, and amino acid metabolism.",
      deficiencySymptoms: ["Hair loss","scaly red rash around facial openings","depression","lethargy"],
      excessRisks: ["Generally non-toxic","may cause inaccurate results in certain laboratory tests"],
    },
    sourceRef: {
      source: 'lpi',
      id: "biotin",
      url: "https://lpi.oregonstate.edu/mic/vitamins/biotin",
      retrievedAt: "2026-04-20",
    },
  },
  {
    ingredientId: "calcium",
    summaryZh: {
      functionBrief: "它是骨骼和牙齿的“钢筋混凝土”，还负责指挥肌肉收缩和神经信号传递。",
      deficiencySymptoms: ["骨头变脆容易折断","骨质流失","牙齿健康受损"],
      excessRisks: ["补得太猛可能会增加肾结石风险","可能引起肠胃不太舒服"],
    },
    summaryEn: {
      functionBrief: "Major structural element in bones and teeth; essential for cell signaling, muscle contraction, and nerve impulse transmission.",
      deficiencySymptoms: ["Reduced bone mineral density","osteoporosis","increased risk of fractures"],
      excessRisks: ["Kidney stones","hypercalcemia","gastrointestinal disturbances"],
    },
    sourceRef: {
      source: 'lpi',
      id: "calcium",
      url: "https://lpi.oregonstate.edu/mic/minerals/calcium",
      retrievedAt: "2026-04-20",
    },
  },
  {
    ingredientId: "choline",
    summaryZh: {
      functionBrief: "它是大脑和细胞的“结构胶”，帮着传导神经信号，还能把肝脏里的脂肪运走。",
      deficiencySymptoms: ["肝脏容易堆积脂肪","肌肉受损","肝功能指标异常"],
      excessRisks: ["补过头可能会让身体有股“鱼腥味”","可能引起出汗变多或血压偏低"],
    },
    summaryEn: {
      functionBrief: "Vital for cell membrane structural integrity, neurotransmitter synthesis (acetylcholine), and lipid transport from the liver.",
      deficiencySymptoms: ["Nonalcoholic fatty liver disease","liver damage","muscle damage"],
      excessRisks: ["Fishy body odor","excessive sweating","low blood pressure"],
    },
    sourceRef: {
      source: 'lpi',
      id: "choline",
      url: "https://lpi.oregonstate.edu/mic/other-nutrients/choline",
      retrievedAt: "2026-04-20",
    },
  },
  {
    ingredientId: "chromium",
    summaryZh: {
      functionBrief: "它能帮胰岛素更好地工作，协助身体处理糖分和脂肪，维持能量平衡。",
      deficiencySymptoms: ["糖耐量受损","胰岛素需求增加","血糖利用异常"],
      excessRisks: ["极高剂量下可能对肾脏造成负担","可能影响肝脏功能"],
    },
    summaryEn: {
      functionBrief: "Trivalent chromium may potentiate insulin action, influencing carbohydrate, fat, and protein metabolism.",
      deficiencySymptoms: ["Impaired glucose tolerance","increased insulin requirements","abnormal glucose utilization"],
      excessRisks: ["Potential kidney failure","impaired liver function"],
    },
    sourceRef: {
      source: 'lpi',
      id: "chromium",
      url: "https://lpi.oregonstate.edu/mic/minerals/chromium",
      retrievedAt: "2026-04-20",
    },
  },
  {
    ingredientId: "copper",
    summaryZh: {
      functionBrief: "它是能量生产的“火花塞”，还帮身体代谢铁元素，维持皮肤和头发颜色。",
      deficiencySymptoms: ["贫血","免疫力下降","骨骼发育异常","皮肤或头发颜色变浅"],
      excessRisks: ["肠胃不适（如腹痛）","长期过量可能对肝脏不利","可能引起恶心"],
    },
    summaryEn: {
      functionBrief: "Cofactor for oxidase enzymes; supports energy production, iron metabolism, and connective tissue formation.",
      deficiencySymptoms: ["Anemia","neutropenia","bone abnormalities","depigmentation"],
      excessRisks: ["Liver damage","abdominal pain","nausea"],
    },
    sourceRef: {
      source: 'lpi',
      id: "copper",
      url: "https://lpi.oregonstate.edu/mic/minerals/copper",
      retrievedAt: "2026-04-20",
    },
  },
  {
    ingredientId: "coq10",
    summaryZh: {
      functionBrief: "辅酶 Q10 是种脂溶性抗氧化剂，能帮细胞产生能量，对心脏挺重要。",
      deficiencySymptoms: ["肌肉无力","容易疲劳","神经系统功能受损"],
      excessRisks: ["通常很安全","极少数人可能有轻微肠胃不适"],
    },
    summaryEn: {
      functionBrief: "A fat-soluble antioxidant and essential component of the mitochondrial electron transport chain for energy production.",
      deficiencySymptoms: ["Muscle weakness","neurological issues","increased oxidative stress"],
      excessRisks: ["Generally well-tolerated","potential mild gastrointestinal upset"],
    },
    sourceRef: {
      source: 'lpi',
      id: "coq10",
      url: "https://lpi.oregonstate.edu/mic/other-nutrients/coenzyme-Q10",
      retrievedAt: "2026-04-20",
    },
  },
  {
    ingredientId: "folate",
    summaryZh: {
      functionBrief: "它是细胞生长的“建筑师”，负责制造DNA和蛋白质，对备孕和孕期尤为关键。",
      deficiencySymptoms: ["巨幼红细胞贫血","身体虚弱","易疲劳","胎儿神经管畸形"],
      excessRisks: ["过量可能掩盖维生素B12缺乏的迹象","极高剂量可能诱发某些已有肿瘤的生长"],
    },
    summaryEn: {
      functionBrief: "Critical for one-carbon metabolism, DNA/RNA synthesis, amino acid conversion, and proper cell division.",
      deficiencySymptoms: ["Megaloblastic anemia","fatigue","weakness","neural tube defects"],
      excessRisks: ["Masking vitamin B12 deficiency","potentially delaying its detection","potential promotion of pre-existing tumor growth"],
    },
    sourceRef: {
      source: 'lpi',
      id: "folate",
      url: "https://lpi.oregonstate.edu/mic/vitamins/folate",
      retrievedAt: "2026-04-20",
    },
  },
  {
    ingredientId: "glucosamine",
    summaryZh: {
      functionBrief: "氨基葡萄糖是合成软骨的重要原料，能帮关节保持灵活。（LPI 未列独立页，本条综合 Health Topics）",
      deficiencySymptoms: ["关节僵硬","软骨磨损","活动能力下降"],
      excessRisks: ["少数人可能有轻微消化不适","海鲜过敏者需多留意"],
    },
    summaryEn: {
      functionBrief: "An amino sugar that serves as a precursor for glycosaminoglycans, essential for cartilage structure and joint health.",
      deficiencySymptoms: ["Joint stiffness","cartilage degradation","reduced mobility"],
      excessRisks: ["Potential for mild digestive upset","allergic reactions in shellfish-sensitive individuals"],
    },
    sourceRef: {
      source: 'lpi',
      id: "glucosamine",
      url: "https://lpi.oregonstate.edu/mic/health-disease/bone-health",
      retrievedAt: "2026-04-20",
    },
  },
  {
    ingredientId: "iodine",
    summaryZh: {
      functionBrief: "它是合成甲状腺激素的关键，帮身体管好代谢、生长和大脑发育。",
      deficiencySymptoms: ["甲状腺肿（大脖子病）","甲状腺功能减退","智力发育受阻","克汀病"],
      excessRisks: ["可能引起甲状腺功能亢进","可能诱发甲状腺肿大"],
    },
    summaryEn: {
      functionBrief: "Essential component of thyroid hormones (T3, T4) regulating growth, neurological development, and metabolism.",
      deficiencySymptoms: ["Goiter","hypothyroidism","intellectual impairment","cretinism"],
      excessRisks: ["Iodine-induced hyperthyroidism","goiter","hypothyroidism"],
    },
    sourceRef: {
      source: 'lpi',
      id: "iodine",
      url: "https://lpi.oregonstate.edu/mic/minerals/iodine",
      retrievedAt: "2026-04-20",
    },
  },
  {
    ingredientId: "iron",
    summaryZh: {
      functionBrief: "它是身体搬运氧气的“搬运工”，还参与能量产生和DNA合成，对维持活力至关重要。",
      deficiencySymptoms: ["容易疲劳","心跳加快","指甲变脆","面色苍白"],
      excessRisks: ["肠胃不适（如恶心、呕吐）","可能干扰部分药物吸收","长期过量可能对器官产生负担"],
    },
    summaryEn: {
      functionBrief: "Essential for oxygen transport via hemoglobin, energy production, and DNA synthesis.",
      deficiencySymptoms: ["Fatigue","rapid heart rate","palpitations","brittle/spoon-shaped nails"],
      excessRisks: ["Gastrointestinal irritation","interference with medication absorption","organ damage from toxic deposition"],
    },
    sourceRef: {
      source: 'lpi',
      id: "iron",
      url: "https://lpi.oregonstate.edu/mic/minerals/iron",
      retrievedAt: "2026-04-20",
    },
  },
  {
    ingredientId: "lutein",
    summaryZh: {
      functionBrief: "叶黄素是种抗氧化剂，能帮眼睛过滤蓝光，保护视网膜。（LPI 未列独立页，本条综合 Health Topics）",
      deficiencySymptoms: ["视力下降","增加黄斑变性风险","皮肤健康受损"],
      excessRisks: ["摄入过多可能让皮肤暂时变黄","通常停用后会恢复"],
    },
    summaryEn: {
      functionBrief: "A xanthophyll carotenoid that acts as an antioxidant and filters blue light to protect eye tissues.",
      deficiencySymptoms: ["Increased risk of age-related macular degeneration","reduced visual acuity","poor skin health"],
      excessRisks: ["High intake may lead to harmless yellowing of the skin"],
    },
    sourceRef: {
      source: 'lpi',
      id: "lutein",
      url: "https://lpi.oregonstate.edu/mic/other-nutrients/carotenoids",
      retrievedAt: "2026-04-20",
    },
  },
  {
    ingredientId: "magnesium",
    summaryZh: {
      functionBrief: "它是身体里的“全能助手”，参与300多种反应，帮我们产生能量并维持肌肉正常。",
      deficiencySymptoms: ["肌肉痉挛","食欲不振","恶心","情绪波动"],
      excessRisks: ["容易引起腹泻","肠胃不适","过量摄入可能增加肾脏代谢压力"],
    },
    summaryEn: {
      functionBrief: "Cofactor for 300+ enzymes; involved in energy production, protein synthesis, and muscle/nerve function.",
      deficiencySymptoms: ["Muscle spasms","loss of appetite","nausea","personality changes"],
      excessRisks: ["Diarrhea","nausea","stomach cramping"],
    },
    sourceRef: {
      source: 'lpi',
      id: "magnesium",
      url: "https://lpi.oregonstate.edu/mic/minerals/magnesium",
      retrievedAt: "2026-04-20",
    },
  },
  {
    ingredientId: "manganese",
    summaryZh: {
      functionBrief: "它是细胞里的“抗氧化小能手”，协助代谢糖类和脂肪，帮助骨骼生长。",
      deficiencySymptoms: ["生长缓慢","骨骼发育异常","血糖代谢波动","皮肤出现红疹"],
      excessRisks: ["长期过量可能影响神经系统","可能引起情绪波动"],
    },
    summaryEn: {
      functionBrief: "Involved in antioxidant defense (MnSOD), metabolism of carbs/amino acids, and bone formation.",
      deficiencySymptoms: ["Impaired growth","skeletal abnormalities","altered glucose metabolism","skin rash"],
      excessRisks: ["Neurological symptoms","psychiatric changes"],
    },
    sourceRef: {
      source: 'lpi',
      id: "manganese",
      url: "https://lpi.oregonstate.edu/mic/minerals/manganese",
      retrievedAt: "2026-04-20",
    },
  },
  {
    ingredientId: "melatonin",
    summaryZh: {
      functionBrief: "褪黑素是种调节生物钟的激素，能帮人更快入睡，改善睡眠。（LPI 未列独立页，本条综合 Health Topics）",
      deficiencySymptoms: ["入睡困难","睡眠质量差","昼夜节律紊乱"],
      excessRisks: ["白天可能会感到困倦","可能出现多梦"],
    },
    summaryEn: {
      functionBrief: "A hormone produced by the pineal gland that regulates the sleep-wake cycle and acts as a potent antioxidant.",
      deficiencySymptoms: ["Sleep disturbances","insomnia","disrupted circadian rhythms"],
      excessRisks: ["Daytime drowsiness","vivid dreams","potential hormonal feedback interference"],
    },
    sourceRef: {
      source: 'lpi',
      id: "melatonin",
      url: "https://lpi.oregonstate.edu/mic/health-disease/sleep",
      retrievedAt: "2026-04-20",
    },
  },
  {
    ingredientId: "molybdenum",
    summaryZh: {
      functionBrief: "它是几种重要酶的“零件”，帮身体代谢氨基酸和核苷酸，维持正常生化反应。",
      deficiencySymptoms: ["心跳呼吸加快","头痛","夜盲","代谢紊乱"],
      excessRisks: ["摄入过多可能导致尿酸水平升高","可能引起关节不适"],
    },
    summaryEn: {
      functionBrief: "Essential cofactor for enzymes like sulfite oxidase, involved in sulfur amino acid and nucleotide metabolism.",
      deficiencySymptoms: ["Rapid heart/respiratory rates","headaches","night blindness","coma"],
      excessRisks: ["Increased uric acid levels","gout-like symptoms"],
    },
    sourceRef: {
      source: 'lpi',
      id: "molybdenum",
      url: "https://lpi.oregonstate.edu/mic/minerals/molybdenum",
      retrievedAt: "2026-04-20",
    },
  },
  {
    ingredientId: "niacin",
    summaryZh: {
      functionBrief: "它是细胞里的“全能助手”，管能量也管DNA修复，对皮肤和消化系统健康至关重要。",
      deficiencySymptoms: ["糙皮病","日光性皮炎","腹泻","神志不清"],
      excessRisks: ["补充过量可能诱发皮肤潮红","长期超大剂量可能导致肝功能受损"],
    },
    summaryEn: {
      functionBrief: "Precursor to NAD and NADP, supporting redox reactions in energy metabolism, DNA repair, and cell signaling.",
      deficiencySymptoms: ["Sun-sensitive dermatitis","diarrhea","delirium","mouth inflammation"],
      excessRisks: ["Skin flushing","potential liver stress at high doses","impaired glucose tolerance"],
    },
    sourceRef: {
      source: 'lpi',
      id: "niacin",
      url: "https://lpi.oregonstate.edu/mic/vitamins/niacin",
      retrievedAt: "2026-04-20",
    },
  },
  {
    ingredientId: "omega-3",
    summaryZh: {
      functionBrief: "它们是细胞膜的重要成分，对大脑和眼睛发育至关重要，还能产生抗炎物质。",
      deficiencySymptoms: ["视力问题","感觉神经病变","皮肤干燥脱屑"],
      excessRisks: ["可能会延长凝血时间","可能对免疫反应产生影响"],
    },
    summaryEn: {
      functionBrief: "Structural components of cell membranes; precursors to anti-inflammatory lipid mediators; essential for brain and eye development.",
      deficiencySymptoms: ["Visual problems","sensory neuropathy","scaly skin rash"],
      excessRisks: ["Increased bleeding time","potential immune suppression"],
    },
    sourceRef: {
      source: 'lpi',
      id: "omega-3",
      url: "https://lpi.oregonstate.edu/mic/other-nutrients/essential-fatty-acids",
      retrievedAt: "2026-04-20",
    },
  },
  {
    ingredientId: "pantothenic-acid",
    summaryZh: {
      functionBrief: "它是合成辅酶A的关键原料，帮身体从食物里“抠”出能量，还能帮着制造脂肪和荷尔蒙。",
      deficiencySymptoms: ["容易疲劳","睡不着觉","肚子不舒服","手脚发麻"],
      excessRisks: ["非常安全","如果一下子吃得特别多，可能会让肚子不舒服"],
    },
    summaryEn: {
      functionBrief: "Precursor for coenzyme A, essential for energy production from macronutrients and synthesis of fats, cholesterol, and hormones.",
      deficiencySymptoms: ["Fatigue","insomnia","intestinal disturbances","numbness and tingling in hands and feet"],
      excessRisks: ["Generally non-toxic","very high doses may cause diarrhea"],
    },
    sourceRef: {
      source: 'lpi',
      id: "pantothenic-acid",
      url: "https://lpi.oregonstate.edu/mic/vitamins/pantothenic-acid",
      retrievedAt: "2026-04-20",
    },
  },
  {
    ingredientId: "probiotics",
    summaryZh: {
      functionBrief: "益生菌是能调节免疫、增强肠道屏障的活微生物，常在发酵食品中。（LPI 未列独立页，本条综合 Health Topics）",
      deficiencySymptoms: ["肠道屏障功能减弱","抗体产生减少","易受病原体感染"],
      excessRisks: ["不同菌株效果各异","特定情况下需注意免疫反应"],
    },
    summaryEn: {
      functionBrief: "Live microorganisms that benefit health by modulating immune functions and strengthening the gut epithelial barrier.",
      deficiencySymptoms: ["Weakened gut barrier","reduced antibody production","increased susceptibility to intestinal infections"],
      excessRisks: ["Strain-dependent effects","potential for diverse immune modulations"],
    },
    sourceRef: {
      source: 'lpi',
      id: "probiotics",
      url: "https://lpi.oregonstate.edu/mic/health-disease/immunity",
      retrievedAt: "2026-04-20",
    },
  },
  {
    ingredientId: "riboflavin",
    summaryZh: {
      functionBrief: "它是身体里的“能量搬运工”，参与能量制造和抗氧化，还能帮其他B族维生素干活。",
      deficiencySymptoms: ["嘴角裂口","舌头红肿","咽喉肿痛","脂溢性皮炎"],
      excessRisks: ["安全性很高","过量可能导致尿液变成亮黄色"],
    },
    summaryEn: {
      functionBrief: "Precursor to FAD and FMN coenzymes, vital for energy production, antioxidant defense, and nutrient metabolism.",
      deficiencySymptoms: ["Sore throat","cracked lips (cheilosis)","tongue inflammation","skin dermatitis"],
      excessRisks: ["No known toxic effects","high doses may cause harmless bright yellow urine"],
    },
    sourceRef: {
      source: 'lpi',
      id: "riboflavin",
      url: "https://lpi.oregonstate.edu/mic/vitamins/riboflavin",
      retrievedAt: "2026-04-20",
    },
  },
  {
    ingredientId: "selenium",
    summaryZh: {
      functionBrief: "它是身体里的“抗氧化小能手”，通过硒蛋白保护细胞，对甲状腺和免疫力很重要。",
      deficiencySymptoms: ["克山病（心肌受损）","大骨节病","免疫力下降"],
      excessRisks: ["长期过量可能导致头发和指甲变脆脱落","呼气可能有异味"],
    },
    summaryEn: {
      functionBrief: "Component of selenoproteins like glutathione peroxidases; acts as an antioxidant and supports thyroid hormone metabolism.",
      deficiencySymptoms: ["Keshan disease","Kashin-Beck disease","impaired immune function"],
      excessRisks: ["Selenosis (hair/nail loss)","gastrointestinal disturbances","garlic breath odor"],
    },
    sourceRef: {
      source: 'lpi',
      id: "selenium",
      url: "https://lpi.oregonstate.edu/mic/minerals/selenium",
      retrievedAt: "2026-04-20",
    },
  },
  {
    ingredientId: "thiamin",
    summaryZh: {
      functionBrief: "它是能量代谢的“火种”，帮身体把碳水和脂肪转化成动力，对神经系统也很重要。",
      deficiencySymptoms: ["脚气病","周围神经病变","心跳加快","下肢水肿"],
      excessRisks: ["长期口服通常很安全","大剂量静脉注射可能诱发过敏反应"],
    },
    summaryEn: {
      functionBrief: "Essential coenzyme for carbohydrate, amino acid, and fatty acid metabolism, supporting energy production and ribose synthesis.",
      deficiencySymptoms: ["Peripheral neuropathy","rapid heart rate","edema","cognitive impairment"],
      excessRisks: ["No established oral toxicity","rare anaphylactic reactions with large intravenous doses"],
    },
    sourceRef: {
      source: 'lpi',
      id: "thiamin",
      url: "https://lpi.oregonstate.edu/mic/vitamins/thiamin",
      retrievedAt: "2026-04-20",
    },
  },
  {
    ingredientId: "vitamin-a",
    summaryZh: {
      functionBrief: "维A对视力、免疫力和细胞生长至关重要，能帮我们维持暗光下的视觉，并促进胚胎发育。",
      deficiencySymptoms: ["夜盲症","眼睛干涩（毕脱氏斑）","皮肤粗糙","免疫力下降易感染"],
      excessRisks: ["孕期过量可能导致胎儿畸形","可能诱发肝损伤","过量可能导致骨骼疼痛"],
    },
    summaryEn: {
      functionBrief: "Essential for vision, immune function, gene expression, and embryonic development.",
      deficiencySymptoms: ["Night blindness","Bitot's spots","xerophthalmia","increased susceptibility to infections"],
      excessRisks: ["Severe birth defects","liver damage","bone and joint pain"],
    },
    sourceRef: {
      source: 'lpi',
      id: "vitamin-a",
      url: "https://lpi.oregonstate.edu/mic/vitamins/vitamin-A",
      retrievedAt: "2026-04-20",
    },
  },
  {
    ingredientId: "vitamin-b12",
    summaryZh: {
      functionBrief: "它是制造红细胞和维持神经健康的“建筑师”，还能帮身体处理叶酸，让基因合成更顺畅。",
      deficiencySymptoms: ["贫血导致没力气","手脚发麻像针扎","记性变差","走路不稳"],
      excessRisks: ["目前没发现明显的过量危害","身体通常能很好地处理多余的部分"],
    },
    summaryEn: {
      functionBrief: "Essential for folate metabolism, DNA synthesis, red blood cell formation, and maintaining the myelin sheath around neurons.",
      deficiencySymptoms: ["Megaloblastic anemia","fatigue","numbness or tingling in extremities","memory loss"],
      excessRisks: ["No tolerable upper intake level set due to low toxicity"],
    },
    sourceRef: {
      source: 'lpi',
      id: "vitamin-b12",
      url: "https://lpi.oregonstate.edu/mic/vitamins/vitamin-B12",
      retrievedAt: "2026-04-20",
    },
  },
  {
    ingredientId: "vitamin-b6",
    summaryZh: {
      functionBrief: "它是蛋白质代谢的“总管”，还负责制造快乐激素，对大脑和血液都很重要。",
      deficiencySymptoms: ["情绪易怒","抑郁","口腔溃疡","贫血"],
      excessRisks: ["长期超量服用可能导致感觉神经受损","过量可能诱发四肢麻木或疼痛"],
    },
    summaryEn: {
      functionBrief: "Coenzyme for over 100 enzymes involved in protein metabolism, neurotransmitter synthesis, and hemoglobin production.",
      deficiencySymptoms: ["Irritability","depression","mouth sores","microcytic anemia"],
      excessRisks: ["Sensory neuropathy","numbness in extremities","difficulty walking"],
    },
    sourceRef: {
      source: 'lpi',
      id: "vitamin-b6",
      url: "https://lpi.oregonstate.edu/mic/vitamins/vitamin-B6",
      retrievedAt: "2026-04-20",
    },
  },
  {
    ingredientId: "vitamin-c",
    summaryZh: {
      functionBrief: "它是合成胶原蛋白的关键，能帮身体抗氧化、增强免疫力，还能促进铁的吸收，让身体更有活力。",
      deficiencySymptoms: ["坏血病（感到极度疲劳无力）","牙龈出血或皮肤容易青紫淤血","伤口愈合速度变慢","关节疼痛和肿胀"],
      excessRisks: ["腹泻及胃肠道不适","可能诱发肾结石（特定人群）"],
    },
    summaryEn: {
      functionBrief: "Essential for collagen synthesis and immune support. Acts as a potent antioxidant and enhances iron absorption from plant-based foods.",
      deficiencySymptoms: ["Scurvy (extreme fatigue and weakness)","Easy bruising and bleeding gums","Slow wound healing","Joint pain and swelling"],
      excessRisks: ["Diarrhea and gastrointestinal distress","Increased risk of kidney stones in predisposed individuals"],
    },
    sourceRef: {
      source: 'lpi',
      id: "vitamin-c",
      url: "https://lpi.oregonstate.edu/mic/vitamins/vitamin-C",
      retrievedAt: "2026-04-20",
    },
  },
  {
    ingredientId: "vitamin-d",
    summaryZh: {
      functionBrief: "它是骨骼的守护神，能促进钙吸收，让骨头更强壮，还能调节免疫系统。",
      deficiencySymptoms: ["佝偻病（儿童）","骨软化症（成人）","肌肉无力或疼痛","骨质疏松风险增加"],
      excessRisks: ["可能诱发高钙血症","过量可能导致肾结石","可能引起软组织钙化"],
    },
    summaryEn: {
      functionBrief: "Regulates calcium and phosphorus for bone health; modulates immune function and cell growth.",
      deficiencySymptoms: ["Rickets in children","osteomalacia in adults","muscle weakness and pain"],
      excessRisks: ["Hypercalcemia","kidney stones","calcification of soft tissues like heart and vessels"],
    },
    sourceRef: {
      source: 'lpi',
      id: "vitamin-d",
      url: "https://lpi.oregonstate.edu/mic/vitamins/vitamin-D",
      retrievedAt: "2026-04-20",
    },
  },
  {
    ingredientId: "vitamin-e",
    summaryZh: {
      functionBrief: "它是强效的抗氧化剂，能保护细胞膜不被自由基破坏，还能增强免疫力。",
      deficiencySymptoms: ["神经损伤（如步态不稳）","肌肉无力","视网膜病变","免疫功能下降"],
      excessRisks: ["过量可能导致凝血功能障碍","可能诱发异常出血","过量可能增加出血性中风风险"],
    },
    summaryEn: {
      functionBrief: "Fat-soluble antioxidant protecting cell membranes from lipid peroxidation; supports immune function.",
      deficiencySymptoms: ["Peripheral neuropathy","ataxia","skeletal myopathy","retinopathy"],
      excessRisks: ["Impaired blood clotting","increased risk of hemorrhage"],
    },
    sourceRef: {
      source: 'lpi',
      id: "vitamin-e",
      url: "https://lpi.oregonstate.edu/mic/vitamins/vitamin-E",
      retrievedAt: "2026-04-20",
    },
  },
  {
    ingredientId: "vitamin-k",
    summaryZh: {
      functionBrief: "它是“凝血功臣”，能帮伤口止血，还能促进骨骼健康，防止血管钙化。",
      deficiencySymptoms: ["凝血时间延长","容易淤青","异常出血（如鼻血）","骨密度降低"],
      excessRisks: ["天然形式通常无毒","合成维K3过量可能导致溶血性贫血","可能诱发肝毒性"],
    },
    summaryEn: {
      functionBrief: "Essential cofactor for blood coagulation, bone metabolism, and preventing soft tissue calcification.",
      deficiencySymptoms: ["Impaired blood clotting","easy bruising","hemorrhage","reduced bone mineral density"],
      excessRisks: ["Liver toxicity (synthetic K3)","hemolytic anemia (synthetic K3)"],
    },
    sourceRef: {
      source: 'lpi',
      id: "vitamin-k",
      url: "https://lpi.oregonstate.edu/mic/vitamins/vitamin-K",
      retrievedAt: "2026-04-20",
    },
  },
  {
    ingredientId: "zinc",
    summaryZh: {
      functionBrief: "它是成长的“建筑师”和免疫的“守护者”，对伤口愈合、味觉发育都非常重要。",
      deficiencySymptoms: ["生长发育迟缓","皮肤红疹","伤口愈合慢","味觉减退"],
      excessRisks: ["长期过量可能导致铜缺乏","引起恶心呕吐","可能干扰其他矿物质平衡"],
    },
    summaryEn: {
      functionBrief: "Essential for growth, immune function, protein folding, and gene expression.",
      deficiencySymptoms: ["Impaired growth","skin rashes","delayed wound healing","diminished taste"],
      excessRisks: ["Copper deficiency (long-term)","nausea","vomiting"],
    },
    sourceRef: {
      source: 'lpi',
      id: "zinc",
      url: "https://lpi.oregonstate.edu/mic/minerals/zinc",
      retrievedAt: "2026-04-20",
    },
  },
];

export const LPI_BY_ID: ReadonlyMap<string, LpiEntry> = new Map(
  LPI_VALUES.map((e) => [e.ingredientId, e]),
);
