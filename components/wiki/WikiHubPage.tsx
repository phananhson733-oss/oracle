// INPUT: Wiki 入口页签与路由状态（含独立页签与 1280 容器约束）。
// OUTPUT: 导出 Wiki 聚合页面组件（仅保留首页/百科页签）。
// POS: Wiki 路由入口；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ActionButton, Container, useLanguage } from '../UIComponents';
import WikiHomePage from './WikiHomePage';
import WikiIndexPage from './WikiIndexPage';

const TAB_VALUES = ['home', 'library'] as const;
type WikiTab = typeof TAB_VALUES[number];

const resolveTab = (search: string): WikiTab => {
  const params = new URLSearchParams(search);
  const tab = params.get('tab');
  return tab === 'library' ? 'library' : 'home';
};

const WikiHubPage: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = useMemo(() => resolveTab(location.search), [location.search]);

  const handleTabChange = (tab: WikiTab) => {
    const params = new URLSearchParams(location.search);
    params.set('tab', tab);
    if (tab === 'home') params.delete('section');
    const next = params.toString();
    navigate(`/wiki${next ? `?${next}` : ''}`);
  };

  return (
    <Container>
      <div className="space-y-10">
        <div className="flex items-center justify-end gap-3">
          {TAB_VALUES.map((tab) => (
            <ActionButton
              key={tab}
              size="sm"
              variant={activeTab === tab ? 'primary' : 'outline'}
              className="rounded-full px-5"
              onClick={() => handleTabChange(tab)}
            >
              {tab === 'home' ? t.wiki.tab_home : t.wiki.tab_library}
            </ActionButton>
          ))}
        </div>

        {activeTab === 'home' ? <WikiHomePage /> : <WikiIndexPage />}
      </div>
    </Container>
  );
};

export default WikiHubPage;
