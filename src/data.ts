export const layers = [
  {id:'satellite', name:'国家卫星', en:'SATELLITE', description:'国家卫星原图。未添加地名与位置标记。'},
  {id:'districts', name:'行政区划', en:'REGIONS', description:'保留原图区划；不将未标名的区域与道名擅自对应。'},
  {id:'roads', name:'首都道路', en:'STREETS', description:'街道的走向，以原始道路图为准。'},
  {id:'metro', name:'地铁网络', en:'TRANSIT', description:'沿原图探索线路，模糊站名不转写。'},
  {id:'capital', name:'首都截图', en:'CAPITAL', description:'首都数据与名称的原始参考。'},
] as const
export type LayerId = typeof layers[number]['id']
export const articles = [
  {id:'capital', category:'城市', title:'首都', subtitle:'人口、海拔与面积。', status:'名称待确认', body:'原始截图清楚展示人口、海拔与面积。城市名称和介绍存在打码，不尝试还原。「金陵城」虽见于道路图手写标注，依照项目要求仍为待确认名称，不作为正式地名。', facts:[['人口','8,942,013 人'],['海拔','5 米'],['面积','4,712 平方公里']], layer:'capital' as LayerId},
  {id:'ruiming', category:'行政区', title:'睿明道', subtitle:'名称已确认，位置与辖区待核实。', status:'名称已确认', body:'睿明道的名称已由项目说明明确确认。其位置、边界、辖区及与首都的关系尚无可访问的原图依据，暂不填写。', facts:[['名称','睿明道'],['边界',''],['辖区','']], layer:'districts' as LayerId},
  {id:'hanyu', category:'行政区', title:'涵宇道', subtitle:'名称已确认，位置与辖区待核实。', status:'名称已确认', body:'涵宇道的名称已由项目说明明确确认。行政层级的更多细节、相邻区域和空间位置均保留为空白，等待进一步核实。', facts:[['名称','涵宇道'],['边界',''],['辖区','']], layer:'districts' as LayerId},
  {id:'flag', category:'国家标志', title:'国旗', subtitle:'用户提供并确认的国旗图像。', status:'已确认', body:'这张旗帜图像由用户提供，并明确确认为国旗。保留原始图案与颜色。旗帜名称、象征含义、制定日期及官方比例尚未提供。', facts:[['资料类型','国旗'],['象征含义',''],['制定日期','']], layer:null},
]
