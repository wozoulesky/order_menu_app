// data/dishes.js
// 菜品数据：本地静态数据，后续直接在此增删菜品即可。
//
// 替换真实图片：把图片放到 images/dishes/ 目录下，
// 文件名与下方 image 字段对应即可（image 留空时显示占位色块）。
//
// 数据结构说明：
//   id           唯一标识（用于跳转传参）
//   name         菜品名称
//   category     所属分类（需在 categories 中存在）
//   image        菜品图片路径，'' 表示用占位
//   ingredients  所需食材 [{ name, amount }]
//   seasonings   所需调味料 [{ name, amount }]
//   steps        制作过程（有序字符串数组）

// 分类列表（左侧栏顺序由此决定）
const categories = ['荤菜', '素菜', '汤品', '主食', '饮品']

// 菜品列表
const dishes = [
  // ===== 荤菜 =====
  {
    id: 'hongshaorou',
    name: '红烧肉',
    category: '荤菜',
    image: '',
    ingredients: [
      { name: '五花肉', amount: '500g' },
      { name: '葱', amount: '2根' },
      { name: '姜', amount: '4片' }
    ],
    seasonings: [
      { name: '生抽', amount: '2勺' },
      { name: '老抽', amount: '1勺' },
      { name: '冰糖', amount: '20g' },
      { name: '料酒', amount: '1勺' }
    ],
    steps: [
      '五花肉切成 2cm 见方的块，冷水下锅，加料酒、姜片焯水去血沫，捞出沥干。',
      '锅中放少许油，下冰糖小火慢炒至焦糖色。',
      '放入五花肉翻炒，使其均匀上色。',
      '加入葱段、姜片，倒入生抽、老抽翻炒出香味。',
      '加开水没过肉，大火烧开后转小火炖 40 分钟。',
      '最后大火收汁至浓稠，装盘即可。'
    ]
  },
  {
    id: 'fanqiechaodan',
    name: '番茄炒蛋',
    category: '荤菜',
    image: '',
    ingredients: [
      { name: '番茄', amount: '2个' },
      { name: '鸡蛋', amount: '3个' },
      { name: '葱', amount: '1根' }
    ],
    seasonings: [
      { name: '盐', amount: '适量' },
      { name: '糖', amount: '1小勺' }
    ],
    steps: [
      '番茄顶部划十字，开水烫后去皮切块；鸡蛋打散加少许盐搅匀。',
      '锅中热油，倒入蛋液炒至刚凝固盛出。',
      '锅中再加少许油，下番茄块翻炒出汁。',
      '加糖、盐调味，倒回鸡蛋翻炒均匀。',
      '撒葱花出锅。'
    ]
  },

  // ===== 素菜 =====
  {
    id: 'suanrongkongxincai',
    name: '蒜蓉空心菜',
    category: '素菜',
    image: '',
    ingredients: [
      { name: '空心菜', amount: '400g' },
      { name: '大蒜', amount: '5瓣' }
    ],
    seasonings: [
      { name: '盐', amount: '适量' },
      { name: '蚝油', amount: '1勺' }
    ],
    steps: [
      '空心菜洗净切段，梗和叶分开；大蒜切末。',
      '锅中热油，爆香一半蒜末。',
      '先下菜梗翻炒至断生，再下菜叶快炒。',
      '加盐、蚝油调味，出锅前撒剩下的一半蒜末翻匀。'
    ]
  },
  {
    id: 'doubanqingjiao',
    name: '虎皮青椒',
    category: '素菜',
    image: '',
    ingredients: [
      { name: '青椒', amount: '5个' },
      { name: '大蒜', amount: '3瓣' }
    ],
    seasonings: [
      { name: '生抽', amount: '2勺' },
      { name: '醋', amount: '1勺' },
      { name: '糖', amount: '1小勺' }
    ],
    steps: [
      '青椒去籽，用刀面拍扁；大蒜切末。',
      '锅不放油，下青椒小火干煎，用锅铲按压，煎出虎皮斑纹后盛出。',
      '锅中加少许油，爆香蒜末。',
      '放入青椒，加生抽、醋、糖翻炒均匀，收汁出锅。'
    ]
  },

  // ===== 汤品 =====
  {
    id: 'dongguatang',
    name: '冬瓜排骨汤',
    category: '汤品',
    image: '',
    ingredients: [
      { name: '排骨', amount: '400g' },
      { name: '冬瓜', amount: '500g' },
      { name: '姜', amount: '3片' },
      { name: '葱', amount: '1根' }
    ],
    seasonings: [
      { name: '盐', amount: '适量' },
      { name: '料酒', amount: '1勺' }
    ],
    steps: [
      '排骨冷水下锅，加料酒、姜片焯水，捞出洗净浮沫。',
      '冬瓜去皮去瓤切块。',
      '砂锅放入排骨、姜片，加足量清水，大火烧开转小火炖 40 分钟。',
      '放入冬瓜继续炖 15 分钟至透明。',
      '加盐调味，撒葱花即可。'
    ]
  },
  {
    id: 'tomatoedangeng',
    name: '番茄蛋花汤',
    category: '汤品',
    image: '',
    ingredients: [
      { name: '番茄', amount: '1个' },
      { name: '鸡蛋', amount: '2个' },
      { name: '香菜', amount: '少许' }
    ],
    seasonings: [
      { name: '盐', amount: '适量' },
      { name: '香油', amount: '几滴' }
    ],
    steps: [
      '番茄去皮切小丁；鸡蛋打散。',
      '锅中加水烧开，下番茄丁煮 2 分钟出味。',
      '加盐调味，转小火，沿锅边缓缓淋入蛋液。',
      '蛋液凝固成花后关火，淋香油、撒香菜即可。'
    ]
  },

  // ===== 主食 =====
  {
    id: 'danzarfan',
    name: '蛋炒饭',
    category: '主食',
    image: '',
    ingredients: [
      { name: '隔夜米饭', amount: '1碗' },
      { name: '鸡蛋', amount: '2个' },
      { name: '葱', amount: '2根' }
    ],
    seasonings: [
      { name: '盐', amount: '适量' },
      { name: '生抽', amount: '少许' }
    ],
    steps: [
      '鸡蛋打散；葱切葱花，葱白葱绿分开。',
      '锅中热油，下蛋液炒散盛出。',
      '锅中再加少许油，爆香葱白，倒入米饭炒散炒热。',
      '倒回鸡蛋，加盐、少许生抽翻炒均匀。',
      '撒葱绿出锅。'
    ]
  },
  {
    id: 'yangrouchuan',
    name: '葱油拌面',
    category: '主食',
    image: '',
    ingredients: [
      { name: '细面条', amount: '200g' },
      { name: '小葱', amount: '6根' }
    ],
    seasonings: [
      { name: '生抽', amount: '2勺' },
      { name: '老抽', amount: '1勺' },
      { name: '糖', amount: '1小勺' },
      { name: '食用油', amount: '3勺' }
    ],
    steps: [
      '小葱洗净擦干，切段，葱白葱绿分开。',
      '锅中放油，先下葱白小火炸微黄，再下葱绿炸至焦脆，捞出葱段。',
      '葱油中加入生抽、老抽、糖，小火煮至冒泡成酱汁。',
      '面条煮熟捞出，过一下凉水沥干。',
      '面条浇上酱汁拌匀，铺上炸葱段即可。'
    ]
  },

  // ===== 饮品 =====
  {
    id: 'shalaodongguacha',
    name: '沙葛冬瓜茶',
    category: '饮品',
    image: '',
    ingredients: [
      { name: '冬瓜', amount: '300g' },
      { name: '红糖', amount: '50g' }
    ],
    seasonings: [
      { name: '冰糖', amount: '适量' }
    ],
    steps: [
      '冬瓜洗净连皮切小块。',
      '冬瓜加红糖拌匀腌制 30 分钟出汁。',
      '连汁倒入锅中小火慢熬，加冰糖，熬至浓稠。',
      '用纱布滤出汁液，冷藏保存。',
      '饮用时取两勺兑温水或冰水即可。'
    ]
  },
  {
    id: 'juzichazh',
    name: '橘子蜂蜜茶',
    category: '饮品',
    image: '',
    ingredients: [
      { name: '橘子', amount: '3个' },
      { name: '蜂蜜', amount: '3勺' }
    ],
    seasonings: [],
    steps: [
      '橘子剥皮，果肉掰成小瓣，橘皮留少许切细丝。',
      '果肉放入杯中，用勺背轻压出汁。',
      '加入蜂蜜和橘皮丝。',
      '冲入温水（约 60℃，避免破坏蜂蜜营养）搅拌均匀即可。'
    ]
  }
]

module.exports = {
  categories,
  dishes
}
