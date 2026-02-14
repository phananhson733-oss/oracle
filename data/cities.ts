/**
 * 城市数据库（以欧美城市为主，共 228 个城市）
 * 目标用户：欧美 18-35 岁年轻人
 * 数据优先级：欧美城市 > 全球主要城市 > 中国主要城市
 * 覆盖：美洲、欧洲、亚洲、非洲、大洋洲主要城市
 */

export interface City {
  id: string;
  name: string;
  province: string;
  country: string;
  pinyin: string;
  pinyinAbbr: string;
  enName?: string;
  lat: number;
  lon: number;
  timezone?: string; // IANA timezone, e.g. 'America/New_York'
}

export const cities: City[] = [
  // ==================== 美国 - 主要城市 ====================
  { id: 'newyork', name: '纽约', province: 'New York', country: 'United States', pinyin: 'niuyue', pinyinAbbr: 'ny', enName: 'New York', lat: 40.7128, lon: -74.0060, timezone: 'America/New_York' },
  { id: 'losangeles', name: '洛杉矶', province: 'California', country: 'United States', pinyin: 'luoshanji', pinyinAbbr: 'lsj', enName: 'Los Angeles', lat: 34.0522, lon: -118.2437, timezone: 'America/Los_Angeles' },
  { id: 'chicago', name: '芝加哥', province: 'Illinois', country: 'United States', pinyin: 'zhijiage', pinyinAbbr: 'zjg', enName: 'Chicago', lat: 41.8781, lon: -87.6298, timezone: 'America/Chicago' },
  { id: 'houston', name: '休斯顿', province: 'Texas', country: 'United States', pinyin: 'xiusidun', pinyinAbbr: 'xsd', enName: 'Houston', lat: 29.7604, lon: -95.3698, timezone: 'America/Chicago' },
  { id: 'phoenix', name: '菲尼克斯', province: 'Arizona', country: 'United States', pinyin: 'feinikesi', pinyinAbbr: 'fnks', enName: 'Phoenix', lat: 33.4484, lon: -112.0740, timezone: 'America/Phoenix' },
  { id: 'philadelphia', name: '费城', province: 'Pennsylvania', country: 'United States', pinyin: 'feicheng', pinyinAbbr: 'fc', enName: 'Philadelphia', lat: 39.9526, lon: -75.1652, timezone: 'America/New_York' },
  { id: 'sanantonio', name: '圣安东尼奥', province: 'Texas', country: 'United States', pinyin: 'shengandongniao', pinyinAbbr: 'sadn', enName: 'San Antonio', lat: 29.4241, lon: -98.4936, timezone: 'America/Chicago' },
  { id: 'sandiego', name: '圣地亚哥', province: 'California', country: 'United States', pinyin: 'shengdiyage', pinyinAbbr: 'sdyg', enName: 'San Diego', lat: 32.7157, lon: -117.1611, timezone: 'America/Los_Angeles' },
  { id: 'dallas', name: '达拉斯', province: 'Texas', country: 'United States', pinyin: 'dalasi', pinyinAbbr: 'dls', enName: 'Dallas', lat: 32.7767, lon: -96.7970, timezone: 'America/Chicago' },
  { id: 'sanjose', name: '圣何塞', province: 'California', country: 'United States', pinyin: 'shenghesai', pinyinAbbr: 'shs', enName: 'San Jose', lat: 37.3382, lon: -121.8863, timezone: 'America/Los_Angeles' },
  { id: 'austin', name: '奥斯汀', province: 'Texas', country: 'United States', pinyin: 'aositing', pinyinAbbr: 'ast', enName: 'Austin', lat: 30.2672, lon: -97.7431, timezone: 'America/Chicago' },
  { id: 'jacksonville', name: '杰克逊维尔', province: 'Florida', country: 'United States', pinyin: 'jiekexunweier', pinyinAbbr: 'jkxwe', enName: 'Jacksonville', lat: 30.3322, lon: -81.6557, timezone: 'America/New_York' },
  { id: 'sanfrancisco', name: '旧金山', province: 'California', country: 'United States', pinyin: 'jiujinshan', pinyinAbbr: 'jjs', enName: 'San Francisco', lat: 37.7749, lon: -122.4194, timezone: 'America/Los_Angeles' },
  { id: 'columbus', name: '哥伦布', province: 'Ohio', country: 'United States', pinyin: 'gelunbu', pinyinAbbr: 'glb', enName: 'Columbus', lat: 39.9612, lon: -82.9988, timezone: 'America/New_York' },
  { id: 'indianapolis', name: '印第安纳波利斯', province: 'Indiana', country: 'United States', pinyin: 'yindiannapolisi', pinyinAbbr: 'ydnpls', enName: 'Indianapolis', lat: 39.7684, lon: -86.1581, timezone: 'America/Indiana/Indianapolis' },
  { id: 'fortworth', name: '沃斯堡', province: 'Texas', country: 'United States', pinyin: 'wosibao', pinyinAbbr: 'wsb', enName: 'Fort Worth', lat: 32.7555, lon: -97.3308, timezone: 'America/Chicago' },
  { id: 'charlotte', name: '夏洛特', province: 'North Carolina', country: 'United States', pinyin: 'xialuote', pinyinAbbr: 'xlt', enName: 'Charlotte', lat: 35.2271, lon: -80.8431, timezone: 'America/New_York' },
  { id: 'seattle', name: '西雅图', province: 'Washington', country: 'United States', pinyin: 'xiyatu', pinyinAbbr: 'xyt', enName: 'Seattle', lat: 47.6062, lon: -122.3321, timezone: 'America/Los_Angeles' },
  { id: 'denver', name: '丹佛', province: 'Colorado', country: 'United States', pinyin: 'danfo', pinyinAbbr: 'df', enName: 'Denver', lat: 39.7392, lon: -104.9903, timezone: 'America/Denver' },
  { id: 'washington', name: '华盛顿', province: 'District of Columbia', country: 'United States', pinyin: 'huashengdun', pinyinAbbr: 'hsd', enName: 'Washington', lat: 38.9072, lon: -77.0369, timezone: 'America/New_York' },
  { id: 'boston', name: '波士顿', province: 'Massachusetts', country: 'United States', pinyin: 'boshidun', pinyinAbbr: 'bsd', enName: 'Boston', lat: 42.3601, lon: -71.0589, timezone: 'America/New_York' },
  { id: 'nashville', name: '纳什维尔', province: 'Tennessee', country: 'United States', pinyin: 'nashiweier', pinyinAbbr: 'nswe', enName: 'Nashville', lat: 36.1627, lon: -86.7816, timezone: 'America/Chicago' },
  { id: 'detroit', name: '底特律', province: 'Michigan', country: 'United States', pinyin: 'ditelv', pinyinAbbr: 'dtl', enName: 'Detroit', lat: 42.3314, lon: -83.0458, timezone: 'America/Detroit' },
  { id: 'portland', name: '波特兰', province: 'Oregon', country: 'United States', pinyin: 'botelan', pinyinAbbr: 'btl', enName: 'Portland', lat: 45.5152, lon: -122.6784, timezone: 'America/Los_Angeles' },
  { id: 'memphis', name: '孟菲斯', province: 'Tennessee', country: 'United States', pinyin: 'mengfeisi', pinyinAbbr: 'mfs', enName: 'Memphis', lat: 35.1495, lon: -90.0490, timezone: 'America/Chicago' },
  { id: 'lasvegas', name: '拉斯维加斯', province: 'Nevada', country: 'United States', pinyin: 'lasiweijiasi', pinyinAbbr: 'lswjs', enName: 'Las Vegas', lat: 36.1699, lon: -115.1398, timezone: 'America/Los_Angeles' },
  { id: 'miami', name: '迈阿密', province: 'Florida', country: 'United States', pinyin: 'maiami', pinyinAbbr: 'mam', enName: 'Miami', lat: 25.7617, lon: -80.1918, timezone: 'America/New_York' },
  { id: 'atlanta', name: '亚特兰大', province: 'Georgia', country: 'United States', pinyin: 'yatelanda', pinyinAbbr: 'ytld', enName: 'Atlanta', lat: 33.7490, lon: -84.3880, timezone: 'America/New_York' },

  // ==================== 美国 - 补充城市 ====================
  { id: 'baltimore', name: '巴尔的摩', province: 'Maryland', country: 'United States', pinyin: 'baerdemo', pinyinAbbr: 'bedm', enName: 'Baltimore', lat: 39.2904, lon: -76.6122, timezone: 'America/New_York' },
  { id: 'milwaukee', name: '密尔沃基', province: 'Wisconsin', country: 'United States', pinyin: 'mierwoji', pinyinAbbr: 'mewj', enName: 'Milwaukee', lat: 43.0389, lon: -87.9065, timezone: 'America/Chicago' },
  { id: 'albuquerque', name: '阿尔伯克基', province: 'New Mexico', country: 'United States', pinyin: 'aerbokeji', pinyinAbbr: 'aebkj', enName: 'Albuquerque', lat: 35.0844, lon: -106.6504, timezone: 'America/Denver' },
  { id: 'tucson', name: '图森', province: 'Arizona', country: 'United States', pinyin: 'tusen', pinyinAbbr: 'ts', enName: 'Tucson', lat: 32.2226, lon: -110.9747, timezone: 'America/Phoenix' },
  { id: 'sacramento', name: '萨克拉门托', province: 'California', country: 'United States', pinyin: 'sakelamentuo', pinyinAbbr: 'sklmt', enName: 'Sacramento', lat: 38.5816, lon: -121.4944, timezone: 'America/Los_Angeles' },
  { id: 'kansascity', name: '堪萨斯城', province: 'Missouri', country: 'United States', pinyin: 'kansasicheng', pinyinAbbr: 'kssc', enName: 'Kansas City', lat: 39.0997, lon: -94.5786, timezone: 'America/Chicago' },
  { id: 'raleigh', name: '罗利', province: 'North Carolina', country: 'United States', pinyin: 'luoli', pinyinAbbr: 'll', enName: 'Raleigh', lat: 35.7796, lon: -78.6382, timezone: 'America/New_York' },
  { id: 'omaha', name: '奥马哈', province: 'Nebraska', country: 'United States', pinyin: 'aomaha', pinyinAbbr: 'amh', enName: 'Omaha', lat: 41.2565, lon: -95.9345, timezone: 'America/Chicago' },
  { id: 'coloradosprings', name: '科罗拉多泉', province: 'Colorado', country: 'United States', pinyin: 'keluoladuoquan', pinyinAbbr: 'klldq', enName: 'Colorado Springs', lat: 38.8339, lon: -104.8214, timezone: 'America/Denver' },
  { id: 'tampa', name: '坦帕', province: 'Florida', country: 'United States', pinyin: 'tanpa', pinyinAbbr: 'tp', enName: 'Tampa', lat: 27.9506, lon: -82.4572, timezone: 'America/New_York' },
  { id: 'neworleans', name: '新奥尔良', province: 'Louisiana', country: 'United States', pinyin: 'xinaoerliang', pinyinAbbr: 'xael', enName: 'New Orleans', lat: 29.9511, lon: -90.0715, timezone: 'America/Chicago' },
  { id: 'honolulu', name: '檀香山', province: 'Hawaii', country: 'United States', pinyin: 'tanxiangshan', pinyinAbbr: 'txs', enName: 'Honolulu', lat: 21.3069, lon: -157.8583, timezone: 'Pacific/Honolulu' },
  { id: 'minneapolis', name: '明尼阿波利斯', province: 'Minnesota', country: 'United States', pinyin: 'mingniapolisi', pinyinAbbr: 'mnapls', enName: 'Minneapolis', lat: 44.9778, lon: -93.2650, timezone: 'America/Chicago' },
  { id: 'oklahomacity', name: '俄克拉荷马城', province: 'Oklahoma', country: 'United States', pinyin: 'ekelahemacheng', pinyinAbbr: 'eklhmc', enName: 'Oklahoma City', lat: 35.4676, lon: -97.5164, timezone: 'America/Chicago' },
  { id: 'cleveland', name: '克利夫兰', province: 'Ohio', country: 'United States', pinyin: 'kelifulan', pinyinAbbr: 'klfl', enName: 'Cleveland', lat: 41.4993, lon: -81.6944, timezone: 'America/New_York' },
  { id: 'pittsburgh', name: '匹兹堡', province: 'Pennsylvania', country: 'United States', pinyin: 'pizibao', pinyinAbbr: 'pzb', enName: 'Pittsburgh', lat: 40.4406, lon: -79.9959, timezone: 'America/New_York' },
  { id: 'cincinnati', name: '辛辛那提', province: 'Ohio', country: 'United States', pinyin: 'xinxinnati', pinyinAbbr: 'xxnt', enName: 'Cincinnati', lat: 39.1031, lon: -84.5120, timezone: 'America/New_York' },
  { id: 'stlouis', name: '圣路易斯', province: 'Missouri', country: 'United States', pinyin: 'shengluyisi', pinyinAbbr: 'slys', enName: 'St. Louis', lat: 38.6270, lon: -90.1994, timezone: 'America/Chicago' },
  { id: 'saltlakecity', name: '盐湖城', province: 'Utah', country: 'United States', pinyin: 'yanhucheng', pinyinAbbr: 'yhc', enName: 'Salt Lake City', lat: 40.7608, lon: -111.8910, timezone: 'America/Denver' },
  { id: 'orlando', name: '奥兰多', province: 'Florida', country: 'United States', pinyin: 'aolanduo', pinyinAbbr: 'ald', enName: 'Orlando', lat: 28.5383, lon: -81.3792, timezone: 'America/New_York' },

  // ==================== 加拿大 ====================
  { id: 'toronto', name: '多伦多', province: 'Ontario', country: 'Canada', pinyin: 'duolunduo', pinyinAbbr: 'dld', enName: 'Toronto', lat: 43.6532, lon: -79.3832, timezone: 'America/Toronto' },
  { id: 'montreal', name: '蒙特利尔', province: 'Quebec', country: 'Canada', pinyin: 'mengteliel', pinyinAbbr: 'mtle', enName: 'Montreal', lat: 45.5017, lon: -73.5673, timezone: 'America/Toronto' },
  { id: 'vancouver', name: '温哥华', province: 'British Columbia', country: 'Canada', pinyin: 'wengehua', pinyinAbbr: 'wgh', enName: 'Vancouver', lat: 49.2827, lon: -123.1207, timezone: 'America/Vancouver' },
  { id: 'calgary', name: '卡尔加里', province: 'Alberta', country: 'Canada', pinyin: 'kaerjiali', pinyinAbbr: 'kejl', enName: 'Calgary', lat: 51.0447, lon: -114.0719, timezone: 'America/Edmonton' },
  { id: 'edmonton', name: '埃德蒙顿', province: 'Alberta', country: 'Canada', pinyin: 'aidemengdun', pinyinAbbr: 'admd', enName: 'Edmonton', lat: 53.5461, lon: -113.4938, timezone: 'America/Edmonton' },
  { id: 'ottawa', name: '渥太华', province: 'Ontario', country: 'Canada', pinyin: 'wotaihua', pinyinAbbr: 'wth', enName: 'Ottawa', lat: 45.4215, lon: -75.6972, timezone: 'America/Toronto' },

  // ==================== 加拿大 - 补充城市 ====================
  { id: 'winnipeg', name: '温尼伯', province: 'Manitoba', country: 'Canada', pinyin: 'wennibo', pinyinAbbr: 'wnb', enName: 'Winnipeg', lat: 49.8951, lon: -97.1384, timezone: 'America/Winnipeg' },
  { id: 'quebeccity', name: '魁北克城', province: 'Quebec', country: 'Canada', pinyin: 'kuibeikecheng', pinyinAbbr: 'kbkc', enName: 'Quebec City', lat: 46.8139, lon: -71.2080, timezone: 'America/Toronto' },
  { id: 'hamilton', name: '汉密尔顿', province: 'Ontario', country: 'Canada', pinyin: 'hanmierdun', pinyinAbbr: 'hmed', enName: 'Hamilton', lat: 43.2557, lon: -79.8711, timezone: 'America/Toronto' },
  { id: 'halifax', name: '哈利法克斯', province: 'Nova Scotia', country: 'Canada', pinyin: 'halifakesi', pinyinAbbr: 'hlfks', enName: 'Halifax', lat: 44.6488, lon: -63.5752, timezone: 'America/Halifax' },
  { id: 'victoria', name: '维多利亚', province: 'British Columbia', country: 'Canada', pinyin: 'weiduoliya', pinyinAbbr: 'wdly', enName: 'Victoria', lat: 48.4284, lon: -123.3656, timezone: 'America/Vancouver' },
  { id: 'saskatoon', name: '萨斯卡通', province: 'Saskatchewan', country: 'Canada', pinyin: 'sasikatong', pinyinAbbr: 'sskt', enName: 'Saskatoon', lat: 52.1332, lon: -106.6700, timezone: 'America/Regina' },

  // ==================== 英国 ====================
  { id: 'london', name: '伦敦', province: 'England', country: 'United Kingdom', pinyin: 'lundun', pinyinAbbr: 'ld', enName: 'London', lat: 51.5074, lon: -0.1278, timezone: 'Europe/London' },
  { id: 'manchester', name: '曼彻斯特', province: 'England', country: 'United Kingdom', pinyin: 'manchesite', pinyinAbbr: 'mcst', enName: 'Manchester', lat: 53.4808, lon: -2.2426, timezone: 'Europe/London' },
  { id: 'birmingham', name: '伯明翰', province: 'England', country: 'United Kingdom', pinyin: 'bominghan', pinyinAbbr: 'bmh', enName: 'Birmingham', lat: 52.4862, lon: -1.8904, timezone: 'Europe/London' },
  { id: 'leeds', name: '利兹', province: 'England', country: 'United Kingdom', pinyin: 'lizi', pinyinAbbr: 'lz', enName: 'Leeds', lat: 53.8008, lon: -1.5491, timezone: 'Europe/London' },
  { id: 'glasgow', name: '格拉斯哥', province: 'Scotland', country: 'United Kingdom', pinyin: 'gelasige', pinyinAbbr: 'glsg', enName: 'Glasgow', lat: 55.8642, lon: -4.2518, timezone: 'Europe/London' },
  { id: 'liverpool', name: '利物浦', province: 'England', country: 'United Kingdom', pinyin: 'liwupu', pinyinAbbr: 'lwp', enName: 'Liverpool', lat: 53.4084, lon: -2.9916, timezone: 'Europe/London' },
  { id: 'edinburgh', name: '爱丁堡', province: 'Scotland', country: 'United Kingdom', pinyin: 'aidingbao', pinyinAbbr: 'adb', enName: 'Edinburgh', lat: 55.9533, lon: -3.1883, timezone: 'Europe/London' },
  { id: 'bristol', name: '布里斯托', province: 'England', country: 'United Kingdom', pinyin: 'bulisituo', pinyinAbbr: 'blst', enName: 'Bristol', lat: 51.4545, lon: -2.5879, timezone: 'Europe/London' },

  // ==================== 英国 - 补充城市 ====================
  { id: 'sheffield', name: '谢菲尔德', province: 'England', country: 'United Kingdom', pinyin: 'xiefeierde', pinyinAbbr: 'xfed', enName: 'Sheffield', lat: 53.3811, lon: -1.4701, timezone: 'Europe/London' },
  { id: 'newcastle', name: '纽卡斯尔', province: 'England', country: 'United Kingdom', pinyin: 'niukasier', pinyinAbbr: 'nkse', enName: 'Newcastle', lat: 54.9783, lon: -1.6178, timezone: 'Europe/London' },
  { id: 'nottingham', name: '诺丁汉', province: 'England', country: 'United Kingdom', pinyin: 'nuodinghan', pinyinAbbr: 'ndh', enName: 'Nottingham', lat: 52.9548, lon: -1.1581, timezone: 'Europe/London' },
  { id: 'leicester', name: '莱斯特', province: 'England', country: 'United Kingdom', pinyin: 'laisite', pinyinAbbr: 'lst', enName: 'Leicester', lat: 52.6369, lon: -1.1398, timezone: 'Europe/London' },
  { id: 'cardiff', name: '卡迪夫', province: 'Wales', country: 'United Kingdom', pinyin: 'kadifu', pinyinAbbr: 'kdf', enName: 'Cardiff', lat: 51.4816, lon: -3.1791, timezone: 'Europe/London' },
  { id: 'belfast', name: '贝尔法斯特', province: 'Northern Ireland', country: 'United Kingdom', pinyin: 'beierfasite', pinyinAbbr: 'befst', enName: 'Belfast', lat: 54.5973, lon: -5.9301, timezone: 'Europe/London' },
  { id: 'brighton', name: '布莱顿', province: 'England', country: 'United Kingdom', pinyin: 'bulaidun', pinyinAbbr: 'bld', enName: 'Brighton', lat: 50.8225, lon: -0.1372, timezone: 'Europe/London' },
  { id: 'southampton', name: '南安普顿', province: 'England', country: 'United Kingdom', pinyin: 'nananpudun', pinyinAbbr: 'napd', enName: 'Southampton', lat: 50.9097, lon: -1.4044, timezone: 'Europe/London' },

  // ==================== 德国 ====================
  { id: 'berlin', name: '柏林', province: 'Berlin', country: 'Germany', pinyin: 'bolin', pinyinAbbr: 'bl', enName: 'Berlin', lat: 52.5200, lon: 13.4050, timezone: 'Europe/Berlin' },
  { id: 'hamburg', name: '汉堡', province: 'Hamburg', country: 'Germany', pinyin: 'hanbao', pinyinAbbr: 'hb', enName: 'Hamburg', lat: 53.5511, lon: 9.9937, timezone: 'Europe/Berlin' },
  { id: 'munich', name: '慕尼黑', province: 'Bavaria', country: 'Germany', pinyin: 'munihei', pinyinAbbr: 'mnh', enName: 'Munich', lat: 48.1351, lon: 11.5820, timezone: 'Europe/Berlin' },
  { id: 'cologne', name: '科隆', province: 'North Rhine-Westphalia', country: 'Germany', pinyin: 'kelong', pinyinAbbr: 'kl', enName: 'Cologne', lat: 50.9375, lon: 6.9603, timezone: 'Europe/Berlin' },
  { id: 'frankfurt', name: '法兰克福', province: 'Hesse', country: 'Germany', pinyin: 'falankfu', pinyinAbbr: 'flkf', enName: 'Frankfurt', lat: 50.1109, lon: 8.6821, timezone: 'Europe/Berlin' },
  { id: 'stuttgart', name: '斯图加特', province: 'Baden-Württemberg', country: 'Germany', pinyin: 'situjiate', pinyinAbbr: 'stjt', enName: 'Stuttgart', lat: 48.7758, lon: 9.1829, timezone: 'Europe/Berlin' },

  // ==================== 德国 - 补充城市 ====================
  { id: 'dusseldorf', name: '杜塞尔多夫', province: 'North Rhine-Westphalia', country: 'Germany', pinyin: 'dusaierduofu', pinyinAbbr: 'dsedf', enName: 'Düsseldorf', lat: 51.2277, lon: 6.7735, timezone: 'Europe/Berlin' },
  { id: 'leipzig', name: '莱比锡', province: 'Saxony', country: 'Germany', pinyin: 'laibixi', pinyinAbbr: 'lbx', enName: 'Leipzig', lat: 51.3397, lon: 12.3731, timezone: 'Europe/Berlin' },
  { id: 'dortmund', name: '多特蒙德', province: 'North Rhine-Westphalia', country: 'Germany', pinyin: 'duotemengde', pinyinAbbr: 'dtmd', enName: 'Dortmund', lat: 51.5136, lon: 7.4653, timezone: 'Europe/Berlin' },
  { id: 'dresden', name: '德累斯顿', province: 'Saxony', country: 'Germany', pinyin: 'deleisidun', pinyinAbbr: 'dlsd', enName: 'Dresden', lat: 51.0504, lon: 13.7373, timezone: 'Europe/Berlin' },

  // ==================== 法国 ====================
  { id: 'paris', name: '巴黎', province: 'Île-de-France', country: 'France', pinyin: 'bali', pinyinAbbr: 'bl', enName: 'Paris', lat: 48.8566, lon: 2.3522, timezone: 'Europe/Paris' },
  { id: 'marseille', name: '马赛', province: 'Provence-Alpes-Côte d\'Azur', country: 'France', pinyin: 'masai', pinyinAbbr: 'ms', enName: 'Marseille', lat: 43.2965, lon: 5.3698, timezone: 'Europe/Paris' },
  { id: 'lyon', name: '里昂', province: 'Auvergne-Rhône-Alpes', country: 'France', pinyin: 'liang', pinyinAbbr: 'la', enName: 'Lyon', lat: 45.7640, lon: 4.8357, timezone: 'Europe/Paris' },
  { id: 'toulouse', name: '图卢兹', province: 'Occitanie', country: 'France', pinyin: 'tulvzi', pinyinAbbr: 'tlz', enName: 'Toulouse', lat: 43.6047, lon: 1.4442, timezone: 'Europe/Paris' },
  { id: 'nice', name: '尼斯', province: 'Provence-Alpes-Côte d\'Azur', country: 'France', pinyin: 'nisi', pinyinAbbr: 'ns', enName: 'Nice', lat: 43.7102, lon: 7.2620, timezone: 'Europe/Paris' },

  // ==================== 法国 - 补充城市 ====================
  { id: 'bordeaux', name: '波尔多', province: 'Nouvelle-Aquitaine', country: 'France', pinyin: 'boerduo', pinyinAbbr: 'bed', enName: 'Bordeaux', lat: 44.8378, lon: -0.5792, timezone: 'Europe/Paris' },
  { id: 'lille', name: '里尔', province: 'Hauts-de-France', country: 'France', pinyin: 'lier', pinyinAbbr: 'le', enName: 'Lille', lat: 50.6292, lon: 3.0573, timezone: 'Europe/Paris' },
  { id: 'nantes', name: '南特', province: 'Pays de la Loire', country: 'France', pinyin: 'nante', pinyinAbbr: 'nt', enName: 'Nantes', lat: 47.2184, lon: -1.5536, timezone: 'Europe/Paris' },

  // ==================== 意大利 ====================
  { id: 'rome', name: '罗马', province: 'Lazio', country: 'Italy', pinyin: 'luoma', pinyinAbbr: 'lm', enName: 'Rome', lat: 41.9028, lon: 12.4964, timezone: 'Europe/Rome' },
  { id: 'milan', name: '米兰', province: 'Lombardy', country: 'Italy', pinyin: 'milan', pinyinAbbr: 'ml', enName: 'Milan', lat: 45.4642, lon: 9.1900, timezone: 'Europe/Rome' },
  { id: 'naples', name: '那不勒斯', province: 'Campania', country: 'Italy', pinyin: 'nabulesi', pinyinAbbr: 'nbls', enName: 'Naples', lat: 40.8518, lon: 14.2681, timezone: 'Europe/Rome' },
  { id: 'turin', name: '都灵', province: 'Piedmont', country: 'Italy', pinyin: 'duling', pinyinAbbr: 'dl', enName: 'Turin', lat: 45.0703, lon: 7.6869, timezone: 'Europe/Rome' },
  { id: 'florence', name: '佛罗伦萨', province: 'Tuscany', country: 'Italy', pinyin: 'foluolunsa', pinyinAbbr: 'flls', enName: 'Florence', lat: 43.7696, lon: 11.2558, timezone: 'Europe/Rome' },

  // ==================== 意大利 - 补充城市 ====================
  { id: 'bologna', name: '博洛尼亚', province: 'Emilia-Romagna', country: 'Italy', pinyin: 'boluoniya', pinyinAbbr: 'blny', enName: 'Bologna', lat: 44.4949, lon: 11.3426, timezone: 'Europe/Rome' },
  { id: 'venice', name: '威尼斯', province: 'Veneto', country: 'Italy', pinyin: 'weinisi', pinyinAbbr: 'wns', enName: 'Venice', lat: 45.4408, lon: 12.3155, timezone: 'Europe/Rome' },
  { id: 'palermo', name: '巴勒莫', province: 'Sicily', country: 'Italy', pinyin: 'balemo', pinyinAbbr: 'blm', enName: 'Palermo', lat: 38.1157, lon: 13.3615, timezone: 'Europe/Rome' },

  // ==================== 西班牙 ====================
  { id: 'madrid', name: '马德里', province: 'Community of Madrid', country: 'Spain', pinyin: 'madeli', pinyinAbbr: 'mdl', enName: 'Madrid', lat: 40.4168, lon: -3.7038, timezone: 'Europe/Madrid' },
  { id: 'barcelona', name: '巴塞罗那', province: 'Catalonia', country: 'Spain', pinyin: 'basailuona', pinyinAbbr: 'bsln', enName: 'Barcelona', lat: 41.3851, lon: 2.1734, timezone: 'Europe/Madrid' },
  { id: 'valencia', name: '瓦伦西亚', province: 'Valencian Community', country: 'Spain', pinyin: 'walunxiya', pinyinAbbr: 'wlxy', enName: 'Valencia', lat: 39.4699, lon: -0.3763, timezone: 'Europe/Madrid' },
  { id: 'seville', name: '塞维利亚', province: 'Andalusia', country: 'Spain', pinyin: 'saiweiliya', pinyinAbbr: 'swly', enName: 'Seville', lat: 37.3891, lon: -5.9845, timezone: 'Europe/Madrid' },

  // ==================== 西班牙 - 补充城市 ====================
  { id: 'bilbao', name: '毕尔巴鄂', province: 'Basque Country', country: 'Spain', pinyin: 'bierbaie', pinyinAbbr: 'bebe', enName: 'Bilbao', lat: 43.2630, lon: -2.9350, timezone: 'Europe/Madrid' },
  { id: 'malaga', name: '马拉加', province: 'Andalusia', country: 'Spain', pinyin: 'malajia', pinyinAbbr: 'mlj', enName: 'Malaga', lat: 36.7213, lon: -4.4214, timezone: 'Europe/Madrid' },
  { id: 'zaragoza', name: '萨拉戈萨', province: 'Aragon', country: 'Spain', pinyin: 'salagesa', pinyinAbbr: 'slgs', enName: 'Zaragoza', lat: 41.6488, lon: -0.8891, timezone: 'Europe/Madrid' },

  // ==================== 荷兰 ====================
  { id: 'amsterdam', name: '阿姆斯特丹', province: 'North Holland', country: 'Netherlands', pinyin: 'amusitedan', pinyinAbbr: 'amstd', enName: 'Amsterdam', lat: 52.3676, lon: 4.9041, timezone: 'Europe/Amsterdam' },
  { id: 'rotterdam', name: '鹿特丹', province: 'South Holland', country: 'Netherlands', pinyin: 'lutedan', pinyinAbbr: 'ltd', enName: 'Rotterdam', lat: 51.9225, lon: 4.4792, timezone: 'Europe/Amsterdam' },
  { id: 'hague', name: '海牙', province: 'South Holland', country: 'Netherlands', pinyin: 'haiya', pinyinAbbr: 'hy', enName: 'The Hague', lat: 52.0705, lon: 4.3007, timezone: 'Europe/Amsterdam' },

  // ==================== 其他欧洲国家 ====================
  { id: 'brussels', name: '布鲁塞尔', province: 'Brussels', country: 'Belgium', pinyin: 'bulusaier', pinyinAbbr: 'blse', enName: 'Brussels', lat: 50.8503, lon: 4.3517, timezone: 'Europe/Brussels' },
  { id: 'vienna', name: '维也纳', province: 'Vienna', country: 'Austria', pinyin: 'weiyena', pinyinAbbr: 'wyn', enName: 'Vienna', lat: 48.2082, lon: 16.3738, timezone: 'Europe/Vienna' },
  { id: 'zurich', name: '苏黎世', province: 'Zürich', country: 'Switzerland', pinyin: 'sulishi', pinyinAbbr: 'sls', enName: 'Zurich', lat: 47.3769, lon: 8.5417, timezone: 'Europe/Zurich' },
  { id: 'geneva', name: '日内瓦', province: 'Geneva', country: 'Switzerland', pinyin: 'rineiwa', pinyinAbbr: 'rnw', enName: 'Geneva', lat: 46.2044, lon: 6.1432, timezone: 'Europe/Zurich' },
  { id: 'stockholm', name: '斯德哥尔摩', province: 'Stockholm County', country: 'Sweden', pinyin: 'sidegeermu', pinyinAbbr: 'sdgrm', enName: 'Stockholm', lat: 59.3293, lon: 18.0686, timezone: 'Europe/Stockholm' },
  { id: 'copenhagen', name: '哥本哈根', province: 'Capital Region', country: 'Denmark', pinyin: 'gebenhagen', pinyinAbbr: 'gbhg', enName: 'Copenhagen', lat: 55.6761, lon: 12.5683, timezone: 'Europe/Copenhagen' },
  { id: 'oslo', name: '奥斯陆', province: 'Oslo', country: 'Norway', pinyin: 'aosilu', pinyinAbbr: 'asl', enName: 'Oslo', lat: 59.9139, lon: 10.7522, timezone: 'Europe/Oslo' },
  { id: 'helsinki', name: '赫尔辛基', province: 'Uusimaa', country: 'Finland', pinyin: 'heerxinji', pinyinAbbr: 'hexj', enName: 'Helsinki', lat: 60.1699, lon: 24.9384, timezone: 'Europe/Helsinki' },
  { id: 'moscow', name: '莫斯科', province: 'Moscow', country: 'Russia', pinyin: 'mosike', pinyinAbbr: 'msk', enName: 'Moscow', lat: 55.7558, lon: 37.6173, timezone: 'Europe/Moscow' },
  { id: 'stpetersburg', name: '圣彼得堡', province: 'Saint Petersburg', country: 'Russia', pinyin: 'shengbidebao', pinyinAbbr: 'sbdb', enName: 'St. Petersburg', lat: 59.9343, lon: 30.3351, timezone: 'Europe/Moscow' },
  { id: 'prague', name: '布拉格', province: 'Prague', country: 'Czech Republic', pinyin: 'bulage', pinyinAbbr: 'blg', enName: 'Prague', lat: 50.0755, lon: 14.4378, timezone: 'Europe/Prague' },
  { id: 'warsaw', name: '华沙', province: 'Masovian Voivodeship', country: 'Poland', pinyin: 'huasha', pinyinAbbr: 'hs', enName: 'Warsaw', lat: 52.2297, lon: 21.0122, timezone: 'Europe/Warsaw' },
  { id: 'athens', name: '雅典', province: 'Attica', country: 'Greece', pinyin: 'yadian', pinyinAbbr: 'yd', enName: 'Athens', lat: 37.9838, lon: 23.7275, timezone: 'Europe/Athens' },
  { id: 'lisbon', name: '里斯本', province: 'Lisbon', country: 'Portugal', pinyin: 'lisiben', pinyinAbbr: 'lsb', enName: 'Lisbon', lat: 38.7223, lon: -9.1393, timezone: 'Europe/Lisbon' },
  { id: 'dublin', name: '都柏林', province: 'Leinster', country: 'Ireland', pinyin: 'dubolin', pinyinAbbr: 'dbl', enName: 'Dublin', lat: 53.3498, lon: -6.2603, timezone: 'Europe/Dublin' },

  // ==================== 其他欧洲 - 补充城市 ====================
  { id: 'budapest', name: '布达佩斯', province: 'Budapest', country: 'Hungary', pinyin: 'budapeisi', pinyinAbbr: 'bdps', enName: 'Budapest', lat: 47.4979, lon: 19.0402, timezone: 'Europe/Budapest' },
  { id: 'bucharest', name: '布加勒斯特', province: 'Bucharest', country: 'Romania', pinyin: 'bujialesite', pinyinAbbr: 'bjlst', enName: 'Bucharest', lat: 44.4268, lon: 26.1025, timezone: 'Europe/Bucharest' },
  { id: 'sofia', name: '索非亚', province: 'Sofia', country: 'Bulgaria', pinyin: 'suofeiya', pinyinAbbr: 'sfy', enName: 'Sofia', lat: 42.6977, lon: 23.3219, timezone: 'Europe/Sofia' },
  { id: 'zagreb', name: '萨格勒布', province: 'Zagreb', country: 'Croatia', pinyin: 'sagelebu', pinyinAbbr: 'sglb', enName: 'Zagreb', lat: 45.8150, lon: 15.9819, timezone: 'Europe/Zagreb' },
  { id: 'belgrade', name: '贝尔格莱德', province: 'Belgrade', country: 'Serbia', pinyin: 'beiergelaide', pinyinAbbr: 'begld', enName: 'Belgrade', lat: 44.7866, lon: 20.4489, timezone: 'Europe/Belgrade' },
  { id: 'riga', name: '里加', province: 'Riga', country: 'Latvia', pinyin: 'lijia', pinyinAbbr: 'lj', enName: 'Riga', lat: 56.9496, lon: 24.1052, timezone: 'Europe/Riga' },
  { id: 'vilnius', name: '维尔纽斯', province: 'Vilnius', country: 'Lithuania', pinyin: 'weierniusi', pinyinAbbr: 'wens', enName: 'Vilnius', lat: 54.6872, lon: 25.2797, timezone: 'Europe/Vilnius' },
  { id: 'tallinn', name: '塔林', province: 'Harju', country: 'Estonia', pinyin: 'talin', pinyinAbbr: 'tl', enName: 'Tallinn', lat: 59.4370, lon: 24.7536, timezone: 'Europe/Tallinn' },
  { id: 'ljubljana', name: '卢布尔雅那', province: 'Ljubljana', country: 'Slovenia', pinyin: 'lubueryana', pinyinAbbr: 'lbeyn', enName: 'Ljubljana', lat: 46.0569, lon: 14.5058, timezone: 'Europe/Ljubljana' },
  { id: 'bratislava', name: '布拉迪斯拉发', province: 'Bratislava', country: 'Slovakia', pinyin: 'buladisilafa', pinyinAbbr: 'bldslf', enName: 'Bratislava', lat: 48.1486, lon: 17.1077, timezone: 'Europe/Bratislava' },
  { id: 'krakow', name: '克拉科夫', province: 'Lesser Poland', country: 'Poland', pinyin: 'kelakefu', pinyinAbbr: 'klkf', enName: 'Krakow', lat: 50.0647, lon: 19.9450, timezone: 'Europe/Warsaw' },
  { id: 'porto', name: '波尔图', province: 'Porto', country: 'Portugal', pinyin: 'boertu', pinyinAbbr: 'bet', enName: 'Porto', lat: 41.1579, lon: -8.6291, timezone: 'Europe/Lisbon' },

  // ==================== 澳大利亚 & 新西兰 ====================
  { id: 'sydney', name: '悉尼', province: 'New South Wales', country: 'Australia', pinyin: 'xini', pinyinAbbr: 'xn', enName: 'Sydney', lat: -33.8688, lon: 151.2093, timezone: 'Australia/Sydney' },
  { id: 'melbourne', name: '墨尔本', province: 'Victoria', country: 'Australia', pinyin: 'moerben', pinyinAbbr: 'meb', enName: 'Melbourne', lat: -37.8136, lon: 144.9631, timezone: 'Australia/Melbourne' },
  { id: 'brisbane', name: '布里斯班', province: 'Queensland', country: 'Australia', pinyin: 'bulisiban', pinyinAbbr: 'blsb', enName: 'Brisbane', lat: -27.4698, lon: 153.0251, timezone: 'Australia/Brisbane' },
  { id: 'perth', name: '珀斯', province: 'Western Australia', country: 'Australia', pinyin: 'posi', pinyinAbbr: 'ps', enName: 'Perth', lat: -31.9505, lon: 115.8605, timezone: 'Australia/Perth' },
  { id: 'auckland', name: '奥克兰', province: 'Auckland', country: 'New Zealand', pinyin: 'aokelan', pinyinAbbr: 'akl', enName: 'Auckland', lat: -36.8509, lon: 174.7645, timezone: 'Pacific/Auckland' },
  { id: 'wellington', name: '惠灵顿', province: 'Wellington', country: 'New Zealand', pinyin: 'huilingdun', pinyinAbbr: 'hld', enName: 'Wellington', lat: -41.2866, lon: 174.7756, timezone: 'Pacific/Auckland' },

  // ==================== 澳大利亚/新西兰 - 补充城市 ====================
  { id: 'adelaide', name: '阿德莱德', province: 'South Australia', country: 'Australia', pinyin: 'adelaide', pinyinAbbr: 'adld', enName: 'Adelaide', lat: -34.9285, lon: 138.6007, timezone: 'Australia/Adelaide' },
  { id: 'goldcoast', name: '黄金海岸', province: 'Queensland', country: 'Australia', pinyin: 'huangjinhaian', pinyinAbbr: 'hjha', enName: 'Gold Coast', lat: -28.0167, lon: 153.4000, timezone: 'Australia/Brisbane' },
  { id: 'christchurch', name: '基督城', province: 'Canterbury', country: 'New Zealand', pinyin: 'jiducheng', pinyinAbbr: 'jdc', enName: 'Christchurch', lat: -43.5321, lon: 172.6362, timezone: 'Pacific/Auckland' },

  // ==================== 亚洲主要城市 ====================
  { id: 'tokyo', name: '东京', province: 'Tokyo', country: 'Japan', pinyin: 'dongjing', pinyinAbbr: 'dj', enName: 'Tokyo', lat: 35.6762, lon: 139.6503, timezone: 'Asia/Tokyo' },
  { id: 'osaka', name: '大阪', province: 'Osaka', country: 'Japan', pinyin: 'daban', pinyinAbbr: 'db', enName: 'Osaka', lat: 34.6937, lon: 135.5023, timezone: 'Asia/Tokyo' },
  { id: 'seoul', name: '首尔', province: 'Seoul', country: 'South Korea', pinyin: 'shouer', pinyinAbbr: 'se', enName: 'Seoul', lat: 37.5665, lon: 126.9780, timezone: 'Asia/Seoul' },
  { id: 'singapore', name: '新加坡', province: 'Singapore', country: 'Singapore', pinyin: 'xinjiapo', pinyinAbbr: 'xjp', enName: 'Singapore', lat: 1.3521, lon: 103.8198, timezone: 'Asia/Singapore' },
  { id: 'bangkok', name: '曼谷', province: 'Bangkok', country: 'Thailand', pinyin: 'mangu', pinyinAbbr: 'mg', enName: 'Bangkok', lat: 13.7563, lon: 100.5018, timezone: 'Asia/Bangkok' },
  { id: 'hongkong', name: '香港', province: 'Hong Kong', country: 'China', pinyin: 'xianggang', pinyinAbbr: 'xg', enName: 'Hong Kong', lat: 22.3193, lon: 114.1694, timezone: 'Asia/Hong_Kong' },
  { id: 'dubai', name: '迪拜', province: 'Dubai', country: 'United Arab Emirates', pinyin: 'dibai', pinyinAbbr: 'db', enName: 'Dubai', lat: 25.2048, lon: 55.2708, timezone: 'Asia/Dubai' },
  { id: 'mumbai', name: '孟买', province: 'Maharashtra', country: 'India', pinyin: 'mengmai', pinyinAbbr: 'mm', enName: 'Mumbai', lat: 19.0760, lon: 72.8777, timezone: 'Asia/Kolkata' },

  // ==================== 亚洲 - 补充城市 ====================
  { id: 'delhi', name: '德里', province: 'Delhi', country: 'India', pinyin: 'deli', pinyinAbbr: 'dl', enName: 'Delhi', lat: 28.7041, lon: 77.1025, timezone: 'Asia/Kolkata' },
  { id: 'jakarta', name: '雅加达', province: 'Jakarta', country: 'Indonesia', pinyin: 'yajiada', pinyinAbbr: 'yjd', enName: 'Jakarta', lat: -6.2088, lon: 106.8456, timezone: 'Asia/Jakarta' },
  { id: 'manila', name: '马尼拉', province: 'Metro Manila', country: 'Philippines', pinyin: 'manila', pinyinAbbr: 'mnl', enName: 'Manila', lat: 14.5995, lon: 120.9842, timezone: 'Asia/Manila' },
  { id: 'kualalumpur', name: '吉隆坡', province: 'Kuala Lumpur', country: 'Malaysia', pinyin: 'jilongpo', pinyinAbbr: 'jlp', enName: 'Kuala Lumpur', lat: 3.1390, lon: 101.6869, timezone: 'Asia/Kuala_Lumpur' },
  { id: 'hochiminh', name: '胡志明市', province: 'Ho Chi Minh', country: 'Vietnam', pinyin: 'huzhimingshi', pinyinAbbr: 'hzms', enName: 'Ho Chi Minh City', lat: 10.8231, lon: 106.6297, timezone: 'Asia/Ho_Chi_Minh' },
  { id: 'hanoi', name: '河内', province: 'Hanoi', country: 'Vietnam', pinyin: 'henei', pinyinAbbr: 'hn', enName: 'Hanoi', lat: 21.0278, lon: 105.8342, timezone: 'Asia/Ho_Chi_Minh' },
  { id: 'kyoto', name: '京都', province: 'Kyoto', country: 'Japan', pinyin: 'jingdu', pinyinAbbr: 'jd', enName: 'Kyoto', lat: 35.0116, lon: 135.7681, timezone: 'Asia/Tokyo' },
  { id: 'busan', name: '釜山', province: 'Busan', country: 'South Korea', pinyin: 'fushan', pinyinAbbr: 'fs', enName: 'Busan', lat: 35.1796, lon: 129.0756, timezone: 'Asia/Seoul' },
  { id: 'colombo', name: '科伦坡', province: 'Western', country: 'Sri Lanka', pinyin: 'kelunpo', pinyinAbbr: 'klp', enName: 'Colombo', lat: 6.9271, lon: 79.8612, timezone: 'Asia/Colombo' },
  { id: 'karachi', name: '卡拉奇', province: 'Sindh', country: 'Pakistan', pinyin: 'kalaqi', pinyinAbbr: 'klq', enName: 'Karachi', lat: 24.8607, lon: 67.0011, timezone: 'Asia/Karachi' },
  { id: 'dhaka', name: '达卡', province: 'Dhaka', country: 'Bangladesh', pinyin: 'daka', pinyinAbbr: 'dk', enName: 'Dhaka', lat: 23.8103, lon: 90.4125, timezone: 'Asia/Dhaka' },
  { id: 'phnompenh', name: '金边', province: 'Phnom Penh', country: 'Cambodia', pinyin: 'jinbian', pinyinAbbr: 'jb', enName: 'Phnom Penh', lat: 11.5564, lon: 104.9282, timezone: 'Asia/Phnom_Penh' },

  // ==================== 中东/非洲主要城市 ====================
  { id: 'istanbul', name: '伊斯坦布尔', province: 'Istanbul', country: 'Turkey', pinyin: 'yisitanbuer', pinyinAbbr: 'ystbe', enName: 'Istanbul', lat: 41.0082, lon: 28.9784, timezone: 'Europe/Istanbul' },
  { id: 'ankara', name: '安卡拉', province: 'Ankara', country: 'Turkey', pinyin: 'ankala', pinyinAbbr: 'akl', enName: 'Ankara', lat: 39.9334, lon: 32.8597, timezone: 'Europe/Istanbul' },
  { id: 'telaviv', name: '特拉维夫', province: 'Tel Aviv', country: 'Israel', pinyin: 'telaweifu', pinyinAbbr: 'tlwf', enName: 'Tel Aviv', lat: 32.0853, lon: 34.7818, timezone: 'Asia/Jerusalem' },
  { id: 'riyadh', name: '利雅得', province: 'Riyadh', country: 'Saudi Arabia', pinyin: 'liyade', pinyinAbbr: 'lyd', enName: 'Riyadh', lat: 24.7136, lon: 46.6753, timezone: 'Asia/Riyadh' },
  { id: 'doha', name: '多哈', province: 'Doha', country: 'Qatar', pinyin: 'duoha', pinyinAbbr: 'dh', enName: 'Doha', lat: 25.2854, lon: 51.5310, timezone: 'Asia/Qatar' },
  { id: 'cairo', name: '开罗', province: 'Cairo', country: 'Egypt', pinyin: 'kailuo', pinyinAbbr: 'kl', enName: 'Cairo', lat: 30.0444, lon: 31.2357, timezone: 'Africa/Cairo' },
  { id: 'lagos', name: '拉各斯', province: 'Lagos', country: 'Nigeria', pinyin: 'lagesi', pinyinAbbr: 'lgs', enName: 'Lagos', lat: 6.5244, lon: 3.3792, timezone: 'Africa/Lagos' },
  { id: 'johannesburg', name: '约翰内斯堡', province: 'Gauteng', country: 'South Africa', pinyin: 'yuehanneisibao', pinyinAbbr: 'yhnsb', enName: 'Johannesburg', lat: -26.2041, lon: 28.0473, timezone: 'Africa/Johannesburg' },
  { id: 'capetown', name: '开普敦', province: 'Western Cape', country: 'South Africa', pinyin: 'kaipudun', pinyinAbbr: 'kpd', enName: 'Cape Town', lat: -33.9249, lon: 18.4241, timezone: 'Africa/Johannesburg' },
  { id: 'nairobi', name: '内罗毕', province: 'Nairobi', country: 'Kenya', pinyin: 'neiluobi', pinyinAbbr: 'nlb', enName: 'Nairobi', lat: -1.2921, lon: 36.8219, timezone: 'Africa/Nairobi' },
  { id: 'casablanca', name: '卡萨布兰卡', province: 'Casablanca-Settat', country: 'Morocco', pinyin: 'kasabulanka', pinyinAbbr: 'ksblk', enName: 'Casablanca', lat: 33.5731, lon: -7.5898, timezone: 'Africa/Casablanca' },
  { id: 'addisababa', name: '亚的斯亚贝巴', province: 'Addis Ababa', country: 'Ethiopia', pinyin: 'yadisiyabeiba', pinyinAbbr: 'ydsybb', enName: 'Addis Ababa', lat: 9.0250, lon: 38.7469, timezone: 'Africa/Addis_Ababa' },

  // ==================== 南美洲主要城市 ====================
  { id: 'mexicocity', name: '墨西哥城', province: 'Mexico City', country: 'Mexico', pinyin: 'moxigecheng', pinyinAbbr: 'mxgc', enName: 'Mexico City', lat: 19.4326, lon: -99.1332, timezone: 'America/Mexico_City' },
  { id: 'saopaulo', name: '圣保罗', province: 'São Paulo', country: 'Brazil', pinyin: 'shengbaoluo', pinyinAbbr: 'sbl', enName: 'São Paulo', lat: -23.5505, lon: -46.6333, timezone: 'America/Sao_Paulo' },
  { id: 'riodejaneiro', name: '里约热内卢', province: 'Rio de Janeiro', country: 'Brazil', pinyin: 'liyuereneilu', pinyinAbbr: 'lyrnl', enName: 'Rio de Janeiro', lat: -22.9068, lon: -43.1729, timezone: 'America/Sao_Paulo' },
  { id: 'buenosaires', name: '布宜诺斯艾利斯', province: 'Buenos Aires', country: 'Argentina', pinyin: 'buyinuosiailisi', pinyinAbbr: 'bynsals', enName: 'Buenos Aires', lat: -34.6037, lon: -58.3816, timezone: 'America/Argentina/Buenos_Aires' },

  // ==================== 南美/拉美 - 补充城市 ====================
  { id: 'lima', name: '利马', province: 'Lima', country: 'Peru', pinyin: 'lima', pinyinAbbr: 'lm', enName: 'Lima', lat: -12.0464, lon: -77.0428, timezone: 'America/Lima' },
  { id: 'bogota', name: '波哥大', province: 'Bogota', country: 'Colombia', pinyin: 'bogeda', pinyinAbbr: 'bgd', enName: 'Bogota', lat: 4.7110, lon: -74.0721, timezone: 'America/Bogota' },
  { id: 'santiago', name: '圣地亚哥', province: 'Santiago', country: 'Chile', pinyin: 'shengdiyage', pinyinAbbr: 'sdyg', enName: 'Santiago', lat: -33.4489, lon: -70.6693, timezone: 'America/Santiago' },
  { id: 'havana', name: '哈瓦那', province: 'Havana', country: 'Cuba', pinyin: 'hawana', pinyinAbbr: 'hwn', enName: 'Havana', lat: 23.1136, lon: -82.3666, timezone: 'America/Havana' },
  { id: 'montevideo', name: '蒙得维的亚', province: 'Montevideo', country: 'Uruguay', pinyin: 'mengdeweidiya', pinyinAbbr: 'mdwdy', enName: 'Montevideo', lat: -34.9011, lon: -56.1645, timezone: 'America/Montevideo' },
  { id: 'panamacity', name: '巴拿马城', province: 'Panama', country: 'Panama', pinyin: 'banamacheng', pinyinAbbr: 'bnmc', enName: 'Panama City', lat: 8.9824, lon: -79.5199, timezone: 'America/Panama' },
  { id: 'quito', name: '基多', province: 'Pichincha', country: 'Ecuador', pinyin: 'jiduo', pinyinAbbr: 'jd', enName: 'Quito', lat: -0.1807, lon: -78.4678, timezone: 'America/Guayaquil' },
  { id: 'sanjose_cr', name: '圣何塞', province: 'San Jose', country: 'Costa Rica', pinyin: 'shenghesai', pinyinAbbr: 'shs', enName: 'San Jose', lat: 9.9281, lon: -84.0907, timezone: 'America/Costa_Rica' },

  // ==================== 中国主要城市（精选） ====================
  { id: 'beijing', name: '北京', province: 'Beijing', country: 'China', pinyin: 'beijing', pinyinAbbr: 'bj', enName: 'Beijing', lat: 39.9042, lon: 116.4074, timezone: 'Asia/Shanghai' },
  { id: 'shanghai', name: '上海', province: 'Shanghai', country: 'China', pinyin: 'shanghai', pinyinAbbr: 'sh', enName: 'Shanghai', lat: 31.2304, lon: 121.4737, timezone: 'Asia/Shanghai' },
  { id: 'guangzhou', name: '广州', province: 'Guangdong', country: 'China', pinyin: 'guangzhou', pinyinAbbr: 'gz', enName: 'Guangzhou', lat: 23.1291, lon: 113.2644, timezone: 'Asia/Shanghai' },
  { id: 'shenzhen', name: '深圳', province: 'Guangdong', country: 'China', pinyin: 'shenzhen', pinyinAbbr: 'sz', enName: 'Shenzhen', lat: 22.5431, lon: 114.0579, timezone: 'Asia/Shanghai' },
  { id: 'chengdu', name: '成都', province: 'Sichuan', country: 'China', pinyin: 'chengdu', pinyinAbbr: 'cd', enName: 'Chengdu', lat: 30.5728, lon: 104.0668, timezone: 'Asia/Shanghai' },
  { id: 'hangzhou', name: '杭州', province: 'Zhejiang', country: 'China', pinyin: 'hangzhou', pinyinAbbr: 'hz', enName: 'Hangzhou', lat: 30.2741, lon: 120.1551, timezone: 'Asia/Shanghai' },
  { id: 'wuhan', name: '武汉', province: 'Hubei', country: 'China', pinyin: 'wuhan', pinyinAbbr: 'wh', enName: 'Wuhan', lat: 30.5928, lon: 114.3055, timezone: 'Asia/Shanghai' },
  { id: 'xian', name: '西安', province: 'Shaanxi', country: 'China', pinyin: 'xian', pinyinAbbr: 'xa', enName: 'Xi\'an', lat: 34.3416, lon: 108.9398, timezone: 'Asia/Shanghai' },
  { id: 'chongqing', name: '重庆', province: 'Chongqing', country: 'China', pinyin: 'chongqing', pinyinAbbr: 'cq', enName: 'Chongqing', lat: 29.4316, lon: 106.9123, timezone: 'Asia/Shanghai' },
  { id: 'tianjin', name: '天津', province: 'Tianjin', country: 'China', pinyin: 'tianjin', pinyinAbbr: 'tj', enName: 'Tianjin', lat: 39.3434, lon: 117.3616, timezone: 'Asia/Shanghai' },
  { id: 'nanjing', name: '南京', province: 'Jiangsu', country: 'China', pinyin: 'nanjing', pinyinAbbr: 'nj', enName: 'Nanjing', lat: 32.0603, lon: 118.7969, timezone: 'Asia/Shanghai' },
  { id: 'suzhou', name: '苏州', province: 'Jiangsu', country: 'China', pinyin: 'suzhou', pinyinAbbr: 'sz', enName: 'Suzhou', lat: 31.2989, lon: 120.5853, timezone: 'Asia/Shanghai' },
  { id: 'dalian', name: '大连', province: 'Liaoning', country: 'China', pinyin: 'dalian', pinyinAbbr: 'dl', enName: 'Dalian', lat: 38.9140, lon: 121.6147, timezone: 'Asia/Shanghai' },
  { id: 'qingdao', name: '青岛', province: 'Shandong', country: 'China', pinyin: 'qingdao', pinyinAbbr: 'qd', enName: 'Qingdao', lat: 36.0671, lon: 120.3826, timezone: 'Asia/Shanghai' },
  { id: 'taipei', name: '台北', province: 'Taiwan', country: 'China', pinyin: 'taibei', pinyinAbbr: 'tb', enName: 'Taipei', lat: 25.0330, lon: 121.5654, timezone: 'Asia/Taipei' },
  { id: 'macau', name: '澳门', province: 'Macau', country: 'China', pinyin: 'aomen', pinyinAbbr: 'am', enName: 'Macau', lat: 22.1987, lon: 113.5439, timezone: 'Asia/Macau' },

  // ==================== 中国 - 补充城市 ====================
  { id: 'changsha', name: '长沙', province: 'Hunan', country: 'China', pinyin: 'changsha', pinyinAbbr: 'cs', enName: 'Changsha', lat: 28.2282, lon: 112.9388, timezone: 'Asia/Shanghai' },
  { id: 'zhengzhou', name: '郑州', province: 'Henan', country: 'China', pinyin: 'zhengzhou', pinyinAbbr: 'zz', enName: 'Zhengzhou', lat: 34.7466, lon: 113.6253, timezone: 'Asia/Shanghai' },
  { id: 'jinan', name: '济南', province: 'Shandong', country: 'China', pinyin: 'jinan', pinyinAbbr: 'jn', enName: 'Jinan', lat: 36.6512, lon: 117.1201, timezone: 'Asia/Shanghai' },
  { id: 'fuzhou', name: '福州', province: 'Fujian', country: 'China', pinyin: 'fuzhou', pinyinAbbr: 'fz', enName: 'Fuzhou', lat: 26.0745, lon: 119.2965, timezone: 'Asia/Shanghai' },
  { id: 'hefei', name: '合肥', province: 'Anhui', country: 'China', pinyin: 'hefei', pinyinAbbr: 'hf', enName: 'Hefei', lat: 31.8206, lon: 117.2272, timezone: 'Asia/Shanghai' },
  { id: 'nanning', name: '南宁', province: 'Guangxi', country: 'China', pinyin: 'nanning', pinyinAbbr: 'nn', enName: 'Nanning', lat: 22.8170, lon: 108.3665, timezone: 'Asia/Shanghai' },
  { id: 'guiyang', name: '贵阳', province: 'Guizhou', country: 'China', pinyin: 'guiyang', pinyinAbbr: 'gy', enName: 'Guiyang', lat: 26.6470, lon: 106.6302, timezone: 'Asia/Shanghai' },
  { id: 'kunming', name: '昆明', province: 'Yunnan', country: 'China', pinyin: 'kunming', pinyinAbbr: 'km', enName: 'Kunming', lat: 25.0389, lon: 102.7183, timezone: 'Asia/Shanghai' },
  { id: 'haerbin', name: '哈尔滨', province: 'Heilongjiang', country: 'China', pinyin: 'haerbin', pinyinAbbr: 'heb', enName: 'Harbin', lat: 45.8038, lon: 126.5350, timezone: 'Asia/Shanghai' },
  { id: 'changchun', name: '长春', province: 'Jilin', country: 'China', pinyin: 'changchun', pinyinAbbr: 'cc', enName: 'Changchun', lat: 43.8171, lon: 125.3235, timezone: 'Asia/Shanghai' },
  { id: 'shenyang', name: '沈阳', province: 'Liaoning', country: 'China', pinyin: 'shenyang', pinyinAbbr: 'sy', enName: 'Shenyang', lat: 41.8057, lon: 123.4315, timezone: 'Asia/Shanghai' },
  { id: 'shijiazhuang', name: '石家庄', province: 'Hebei', country: 'China', pinyin: 'shijiazhuang', pinyinAbbr: 'sjz', enName: 'Shijiazhuang', lat: 38.0428, lon: 114.5149, timezone: 'Asia/Shanghai' },
  { id: 'lanzhou', name: '兰州', province: 'Gansu', country: 'China', pinyin: 'lanzhou', pinyinAbbr: 'lz', enName: 'Lanzhou', lat: 36.0611, lon: 103.8343, timezone: 'Asia/Shanghai' },
  { id: 'wulumuqi', name: '乌鲁木齐', province: 'Xinjiang', country: 'China', pinyin: 'wulumuqi', pinyinAbbr: 'wlmq', enName: 'Urumqi', lat: 43.8256, lon: 87.6168, timezone: 'Asia/Shanghai' },
  { id: 'haikou', name: '海口', province: 'Hainan', country: 'China', pinyin: 'haikou', pinyinAbbr: 'hk', enName: 'Haikou', lat: 20.0440, lon: 110.1999, timezone: 'Asia/Shanghai' },
  { id: 'nanchang', name: '南昌', province: 'Jiangxi', country: 'China', pinyin: 'nanchang', pinyinAbbr: 'nc', enName: 'Nanchang', lat: 28.6820, lon: 115.8579, timezone: 'Asia/Shanghai' },
  { id: 'taiyuan', name: '太原', province: 'Shanxi', country: 'China', pinyin: 'taiyuan', pinyinAbbr: 'ty', enName: 'Taiyuan', lat: 37.8706, lon: 112.5489, timezone: 'Asia/Shanghai' },
  { id: 'huhehaote', name: '呼和浩特', province: 'Inner Mongolia', country: 'China', pinyin: 'huhehaote', pinyinAbbr: 'hhht', enName: 'Hohhot', lat: 40.8424, lon: 111.7490, timezone: 'Asia/Shanghai' },
  { id: 'xiamen', name: '厦门', province: 'Fujian', country: 'China', pinyin: 'xiamen', pinyinAbbr: 'xm', enName: 'Xiamen', lat: 24.4798, lon: 118.0894, timezone: 'Asia/Shanghai' },
  { id: 'ningbo', name: '宁波', province: 'Zhejiang', country: 'China', pinyin: 'ningbo', pinyinAbbr: 'nb', enName: 'Ningbo', lat: 29.8683, lon: 121.5440, timezone: 'Asia/Shanghai' },
];
