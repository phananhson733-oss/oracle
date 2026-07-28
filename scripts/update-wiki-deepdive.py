#!/usr/bin/env python3
"""
Update wiki-generated.ts with enriched deep_dive content
将生成的deep_dive内容应用到现有wiki文件中，保持原有结构
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Any

def parse_generated_deep_dive(content: str) -> List[Dict[str, Any]]:
    """Parse generated deep_dive content and return as list of steps"""
    try:
        # Remove markdown code blocks
        content = re.sub(r'^```json\s*', '', content)
        content = re.sub(r'\s*```$', '', content)
        
        # Parse as JSON array
        steps = json.loads(content)
        
        # Add metadata if needed
        for step in steps:
            if 'title' not in step or not step['title'].strip():
                # Generate title from step description
                step['title'] = f"步骤{step.get('step', '')}"
        
        return steps
    except Exception as e:
        print(f"Error parsing JSON: {e}")
        return []

def update_wiki_deep_dive_section(wiki_file: Path, term: str, deep_dive: List[Dict[str, Any]]) -> bool:
    """Update deep_dive section for a specific term"""
    # Read the file
    with open(wiki_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the term section
    # Pattern: "term": { ... "deep_dive": [ ... ], ... }
    pattern = rf'("{term}"\s*{{[^}}]*?)("deep_dive":\s*\[)'
    
    match = re.search(pattern, content, re.DOTALL)
    if match:
        # Get everything after "deep_dive":
        after_deep_dive = match.group(1)
        
        # Generate replacement
        replacement = f'"{term}": ' + match.group(0) + '\n      "deep_dive": ' + json.dumps(deep_dive, ensure_ascii=False, indent=12)
        
        # Replace in content
        new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
        
        # Write back
        with open(wiki_file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        return True
    else:
        print(f"  ✗ Term '{term}' not found in wiki file")
        return False

def main():
    """Main function to apply generated deep_dive content"""
    wiki_file = Path("/Users/wzb/Documents/oracle/backend/src/data/wiki-generated.ts")
    
    # Define generated deep_dive content (these would come from API generation)
    # For now, create a sample with Aquarius, Aries, and Leo which we have examples
    generated_content = {
        "aquarius": [
            {
                "step": 1,
                "title": "解构符号：水瓶的双重本质",
                "description": "水瓶的符号既是水流也是电流，揭示核心矛盾：承载生命的情感之水（巨蟹座象限），却以风元素的理性方式倾泻。神话中伽倪墨得斯被迫离开人间侍奉神灵，隐喻水瓶座身在尘世心在彼岸的疏离感。理解这一张力是解读所有特质的基础——他们的革新冲动常源于对情感混沌的恐惧，转而追求清晰的理念秩序。"
            },
            {
                "step": 2,
                "title": "风元素解析：思维的利与弊",
                "description": "作为风象星座，水瓶的认知模式如同构建不断扩张的概念网络。优势在于跳出框架的关联能力，能发现看似无关事物的深层规律；风险在于过度依赖思维导致情感贫血。需区分客观与抽离：真正客观包含对主观体验的承认，而抽离是用理性隔绝情感。练习标注：当我思考时，我感受什么，可唤醒被压抑的身体感知。"
            },
            {
                "step": 3,
                "title": "固定模式：理念的执着与进化",
                "description": "固定宫赋予水瓶对信念的坚守力量，但也可能固化为认知刚性。他们常将自我价值与特定理念绑定，当理念受挑战时会触发存在性焦虑。健康进化需学习信念的流动性：定期审视核心假设，区分我持有的理念与理念定义的我。对宫狮子座的启示是：理念如舞台，需通过具体行动（表演）获得生命力。"
            },
            {
                "step": 4,
                "title": "天王星守护：突变中的连续性",
                "description": "天王星象征意识结构的量子跃迁，但突变背后存在深层连续性。水瓶座的突发灵感常是长期潜意识酝酿的结果，革新本质是内在模式的外显。警惕为不同而不同的强迫性反叛——真正进步需评估变革的生态影响。练习三问验证：这个改变是源于恐惧（被同化）还是爱（创造价值）？能否分阶段实施？"
            },
            {
                "step": 5,
                "title": "阴影识别：人道主义的陷阱",
                "description": "当人道主义理想脱离具体情境，可能沦为情感暴力的工具。例如用为你好推行未经检验的方案，或用集体名义压抑个体需求。阴影面常表现为：将人简化为理念载体；因预见未来而轻视当下痛苦；用疏离维持清醒假象。识别信号：当谈论人类多于具体人名时，可能已陷入抽象化陷阱。"
            },
            {
                "step": 6,
                "title": "身体智慧：脚踝的隐喻",
                "description": "水瓶座对应脚踝与循环系统，揭示其连接与输送功能。脚踝联结稳固（足）与灵活（腿），隐喻如何在扎根与移动间平衡。循环系统则提醒：理念需如血液般持续流动更新，停滞则成教条。身体练习：赤脚行走感受地面支撑，观想理念如血液从心脏流向末梢再返回，体验给予与接收的完整循环。"
            },
            {
                "step": 7,
                "title": "整合练习：理念的情感翻译",
                "description": "选择一项你热衷的社会议题，进行三层翻译练习：1）用学术语言描述（理性层）；2）用诗歌或绘画表达（情感层）；3）设计一个帮助具体个人的5分钟行动（实践层）。例如从教育公平理念→创作关于某个孩子求学经历的短诗→为社区孩子辅导一次作业。此过程强制思维与情感、抽象与具体的对话。"
            }
        ],
        "aries": [
            {
                "step": 1,
                "title": "认识你的火种：白羊座的本质能量",
                "description": "白羊座作为火象星座的开端，象征生命最初的爆发力——那是纯粹的存在意志。这种能量无关理由或目标，只是本能地确认我在这里。理解白羊座，首先要感受这种原始驱动力：它让你清晨自然醒来、对新事物好奇、在挑战前心跳加速。这不是理性计算的结果，而是生命本身的跃动。荣格会称此为自性的初步显现——通过行动，自我从无意识中分化。"
            },
            {
                "step": 2,
                "title": "火星的召唤：行动背后的心理动机",
                "description": "守护星火星赋予白羊座行动力，但行动背后是深层心理需求：确立自我边界、体验自主权、克服无力感。每个我想要都试图在世界上刻下自我印记。荣格心理学中，火星关联阿尼姆斯（女性内在男性面）或战士原型，代表主动、决断与保护能量。问题在于：你的行动是出于真实自我表达，还是恐惧被忽视？"
            },
            {
                "step": 3,
                "title": "阴影的显现：当勇气变成鲁莽",
                "description": "未整合的白羊能量会显现阴影：冲动变为鲁莽，自信沦为自我中心。阴影常在你感到威胁或无聊时爆发——急于证明自己而忽略风险，或为刺激而制造冲突。荣格认为，阴影是未被意识接纳的自我部分，对白羊座而言，可能是对脆弱或依赖的否认，以过度强硬掩饰。阴影行为后常有后悔或困惑：我当时为什么那样？"
            },
            {
                "step": 4,
                "title": "对宫的启示：从天秤座学习平衡",
                "description": "白羊座的对宫天秤座象征关系、权衡与和谐。这是白羊座成长的关键镜像——如何在坚持自我时考虑他人？天秤座提醒：真正的力量包含选择合作而非征服。荣格的对立整合原则在此适用——白羊的自我主张与天秤的关系协调是一体两面。成熟的白羊学会：行动前短暂权衡，不是放弃勇气，而是让行动更具影响力。"
            },
            {
                "step": 5,
                "title": "整合：将原始冲动转化为成熟力量",
                "description": "整合白羊座能量的核心是将原始冲动转化为成熟、可持续的力量。首先，有意识地暂停——在行动前加入片刻反思，问自己：这真的必要吗？，将火星的即时反应转为战略行动。其次，为能量找到崇高目标，将为战而战转向为价值而战，例如捍卫正义、保护弱小或创新突破。"
            },
            {
                "step": 6,
                "title": "转化：成为意识的观察者",
                "description": "最终目标是成为意识的观察者。荣格认为，思维的阴影可能表现为拒绝的思考方式或沟通恐惧。而真正的客观包含对主观体验的承认。整合后的白羊座需要：1）承认并面对情绪需求；2）学习在关系中平衡自我主张与同理心；3）通过创造性表达和建设性行动实现潜力。这不是消除白羊座特质，而是将其引向更有意义的表达。"
            },
            {
                "step": 7,
                "title": "神圣化：行动服务于更高目的",
                "description": "通过神圣化仪式，将白羊座的力量从单纯的个人欲望工具转化为服务整体人格的神圣力量。创造个人仪式：在面临重大挑战前进行象征性的授剑仪式，将自己的决心和勇气神圣化。将火星的守护精神视为内在指引，而非需要克服的野兽。最终达到一种状态：你的行动源于深刻的自我认知，且与你的灵魂目标对齐。行动变得果断而平静，有力而不残忍。"
            }
        ],
        "leo": [
            {
                "step": 1,
                "title": "自我核心：太阳原型的觉醒",
                "description": "狮子座，作为黄道第五宫由太阳主宰，象征着光明、创造与自我表达的核心能量。在荣格心理学中，狮子座的特质与自我原型的强化紧密相连，自我作为个体意识中心，负责整合心理内容并确立身份认同。荣格强调，太阳在占星学中代表生命力和中心性，这对应于自性原型——心理整体的指引者，驱动个体化过程以实现内在和谐。"
            },
            {
                "step": 2,
                "title": "荣格原型：英雄、国王与太阳",
                "description": "在荣格的原型理论中，狮子座与英雄原型、国王原型和太阳原型深刻关联。英雄原型代表着勇气、征服与自我超越，狮子座个体常通过挑战和成就来证明价值。国王原型则象征权威、秩序与滋养，狮子座渴望被尊为领袖，提供保护与灵感。太阳原型是意识光明与生命力的核心象征，驱动狮子座追求中心地位与创造性表达。"
            },
            {
                "step": 3,
                "title": "阴影面：傲慢、自负与对认可的过度需求",
                "description": "狮子座的阴影面涉及未被意识接受的负面特质，如傲慢、自负和对认可的过度需求，这在荣格心理学中对应于阴影概念——个体压抑或否认的心理内容。荣格认为，阴影源于集体无意识，是自我对立面的积累。对于狮子座而言，阴影可能表现为对失败或忽视的深层恐惧，导致他们在追求荣耀时忽视他人感受。"
            },
            {
                "step": 4,
                "title": "个体化路径：从自我膨胀走向自性完整",
                "description": "狮子座的个体化路径在荣格心理学中是一个通过自我探索实现心理整合的过程，涉及从自我膨胀走向自性完整的旅程。荣格定义个体化为意识与无意识的调和，成为完整而独特的自己。路径始于自我反思，狮子座需识别并接纳阴影，如傲慢或依赖认可。接着，平衡阿尼玛和阿尼姆斯原型，丰富情感深度。"
            },
            {
                "step": 5,
                "title": "内在挑战：自我与无意识的冲突",
                "description": "狮子座在心理成长中面临的内在挑战，根植于荣格心理学中的自我与无意识冲突，主要表现为过度自我中心、对失败的恐惧以及身份认同危机。荣格指出，当狮子座过度认同太阳原型或人格面具时，可能导致自我膨胀，即自我意识膨胀而忽视阴影面。这阻碍了个体化进程，需要在挑战中成长。"
            },
            {
                "step": 6,
                "title": "整合与超越：对立面的创造性统一",
                "description": "狮子座的整合与超越在荣格心理学中涉及对立面的创造性统一，旨在将外在表现与内在深度结合，达到心理整体性。荣格强调，自性作为整合中心，引导狮子座在挑战中成长。整合始于意识扩展，狮子座使用荣格技巧如积极想象来对话无意识。平衡也涉及人格面具与真实自我的协调，社会角色中展现领导力时需保持内在真实。"
            },
            {
                "step": 7,
                "title": "成熟表达：真正的领导力",
                "description": "狮子的成熟表达在荣格心理学框架下体现为真正的领导力，这种领导力源于内在整合而非外在控制。荣格认为，真正的领导力涉及自我与自性的协调，将外在表现与内在深度结合。狮子座通过整合阴影和对立原型，实现内在和谐，从而展现出真正的领导力。这种领导力是服务性的，不仅激励他人成长，也推动集体演进。"
            }
        ]
    }
    
    # Update each term
    updated_count = 0
    for term, deep_dive in generated_content.items():
        if update_wiki_deep_dive_section(wiki_file, term, deep_dive):
            updated_count += 1
            print(f"  ✓ Updated: {term}")
    
    print(f"\nTotal terms updated: {updated_count}")

if __name__ == "__main__":
    main()
