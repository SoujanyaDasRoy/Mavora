"use client";

import React, { useState } from "react";
import {
  Search as SearchIcon,
  Dashboard,
  Task,
  Folder,
  Calendar as CalendarIcon,
  UserMultiple,
  Analytics,
  DocumentAdd,
  Settings as SettingsIcon,
  User as UserIcon,
  ChevronDown as ChevronDownIcon,
  AddLarge,
  Filter,
  Time,
  InProgress,
  CheckmarkOutline,
  Flag,
  Archive,
  View,
  Report,
  StarFilled,
  Group,
  ChartBar,
  FolderOpen,
  Share,
  CloudUpload,
  Security,
  Notification,
  Integration,
} from "@carbon/icons-react";
import { useUser } from "@clerk/nextjs";

const softSpringEasing = "cubic-bezier(0.25, 1.1, 0.4, 1)";

/* ----------------------------- Brand / Logos ----------------------------- */

function BrandBadge() {
  return (
    <div className="relative shrink-0 w-full mb-2">
      <div className="flex items-center gap-3 p-1 w-full">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
          <div className="h-2 w-2 rounded-full bg-zinc-950" />
        </div>
        <div className="flex flex-col">
          <div className="text-base font-bold text-zinc-50 tracking-tight leading-none">
            Mavora
          </div>
          <span className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase mt-0.5">CMS Portal</span>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Avatar -------------------------------- */

function AvatarCircle() {
  const { user } = useUser();
  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("")
    : "U";

  return (
    <div className="relative rounded-full shrink-0 size-8 bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-200 border border-zinc-700/60 shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
      {initials}
    </div>
  );
}

/* ------------------------------ Search Input ----------------------------- */

function SearchContainer({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const [searchValue, setSearchValue] = useState("");

  return (
    <div
      className={`relative shrink-0 transition-all duration-500 ${
        isCollapsed ? "w-full flex justify-center" : "w-full"
      }`}
      style={{ transitionTimingFunction: softSpringEasing }}
    >
      <div
        className={`bg-zinc-900/40 border border-zinc-800/80 h-9 relative rounded-lg flex items-center transition-all duration-500 ${
          isCollapsed ? "w-9 min-w-9 justify-center" : "w-full"
        }`}
        style={{ transitionTimingFunction: softSpringEasing }}
      >
        <div className="flex items-center justify-center shrink-0 p-1 ml-1">
          <SearchIcon size={14} className="text-zinc-500" />
        </div>

        <div
          className={`flex-1 relative transition-opacity duration-500 overflow-hidden ${
            isCollapsed ? "opacity-0 w-0" : "opacity-100 ml-1.5"
          }`}
          style={{ transitionTimingFunction: softSpringEasing }}
        >
          <input
            type="text"
            placeholder="Search panels..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-xs text-zinc-300 placeholder:text-zinc-500 leading-none py-1"
            tabIndex={isCollapsed ? -1 : 0}
          />
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Types / Content Map -------------------------- */

interface MenuItemT {
  icon?: React.ReactNode;
  label: string;
  hasDropdown?: boolean;
  isActive?: boolean;
  children?: MenuItemT[];
}
interface MenuSectionT {
  title: string;
  items: MenuItemT[];
}
interface SidebarContent {
  title: string;
  sections: MenuSectionT[];
}

function getSidebarContent(activeSection: string): SidebarContent {
  const contentMap: Record<string, SidebarContent> = {
    dashboard: {
      title: "Dashboard",
      sections: [
        {
          title: "Dashboard Types",
          items: [
            { icon: <View size={16} />, label: "Overview", isActive: true },
            {
              icon: <Dashboard size={16} />,
              label: "Executive Summary",
              hasDropdown: true,
              children: [
                { label: "Revenue Overview" },
                { label: "Key Performance Indicators" },
                { label: "Strategic Goals Progress" },
                { label: "Department Highlights" },
              ],
            },
            {
              icon: <ChartBar size={16} />,
              label: "Operations Dashboard",
              hasDropdown: true,
              children: [
                { label: "Project Timeline" },
                { label: "Resource Allocation" },
                { label: "Team Performance" },
                { label: "Capacity Planning" },
              ],
            },
            {
              icon: <Analytics size={16} />,
              label: "Financial Dashboard",
              hasDropdown: true,
              children: [
                { label: "Budget vs Actual" },
                { label: "Cash Flow Analysis" },
                { label: "Expense Breakdown" },
                { label: "Profit & Loss Summary" },
              ],
            },
          ],
        },
        {
          title: "Report Summaries",
          items: [
            {
              icon: <Report size={16} />,
              label: "Weekly Reports",
              hasDropdown: true,
              children: [
                { label: "Team Productivity: 87% ↑" },
                { label: "Project Completion: 12/15" },
                { label: "Budget Utilization: 73%" },
                { label: "Client Satisfaction: 4.6/5" },
              ],
            },
            {
              icon: <StarFilled size={16} />,
              label: "Monthly Insights",
              hasDropdown: true,
              children: [
                { label: "Revenue Growth: +15.3%" },
                { label: "New Clients: 24" },
                { label: "Team Expansion: 8 hires" },
                { label: "Cost Reduction: 7.2%" },
              ],
            },
            {
              icon: <View size={16} />,
              label: "Quarterly Analysis",
              hasDropdown: true,
              children: [
                { label: "Market Position: Improved" },
                { label: "ROI: 23.4%" },
                { label: "Customer Retention: 92%" },
                { label: "Innovation Index: 8.7/10" },
              ],
            },
          ],
        },
      ],
    },

    tasks: {
      title: "Tasks",
      sections: [
        {
          title: "Quick Actions",
          items: [
            { icon: <AddLarge size={16} />, label: "New task" },
            { icon: <Filter size={16} />, label: "Filter tasks" },
          ],
        },
        {
          title: "My Tasks",
          items: [
            {
              icon: <Time size={16} />,
              label: "Due today",
              hasDropdown: true,
              children: [
                { icon: <Flag size={14} className="text-zinc-500" />, label: "Review design mockups" },
                { icon: <CheckmarkOutline size={14} className="text-zinc-500" />, label: "Update documentation" },
                { icon: <InProgress size={14} className="text-zinc-500" />, label: "Test new feature" },
              ],
            },
            {
              icon: <InProgress size={16} />,
              label: "In progress",
              hasDropdown: true,
              children: [
                { icon: <Task size={14} className="text-zinc-500" />, label: "Implement user auth" },
                { icon: <Task size={14} className="text-zinc-500" />, label: "Database migration" },
              ],
            },
          ],
        },
      ],
    },

    projects: {
      title: "Projects",
      sections: [
        {
          title: "Active Projects",
          items: [
            {
              icon: <FolderOpen size={16} />,
              label: "Web Application",
              hasDropdown: true,
              children: [
                { icon: <Task size={14} className="text-zinc-500" />, label: "Frontend development" },
                { icon: <Task size={14} className="text-zinc-500" />, label: "API integration" },
              ],
            },
          ],
        },
      ],
    },

    calendar: {
      title: "Calendar",
      sections: [
        {
          title: "Views",
          items: [
            { icon: <View size={16} />, label: "Month view" },
            { icon: <CalendarIcon size={16} />, label: "Week view" },
          ],
        },
      ],
    },

    teams: {
      title: "Teams",
      sections: [
        {
          title: "My Teams",
          items: [
            {
              icon: <Group size={16} />,
              label: "Development Team",
              hasDropdown: true,
              children: [
                { icon: <UserIcon size={14} className="text-zinc-500" />, label: "John Doe (Lead)" },
                { icon: <UserIcon size={14} className="text-zinc-500" />, label: "Jane Smith" },
              ],
            },
          ],
        },
      ],
    },

    analytics: {
      title: "Analytics",
      sections: [
        {
          title: "Reports",
          items: [
            { icon: <Report size={16} />, label: "Performance report" },
            { icon: <ChartBar size={16} />, label: "Task completion" },
          ],
        },
      ],
    },

    files: {
      title: "Files",
      sections: [
        {
          title: "Quick Actions",
          items: [
            { icon: <CloudUpload size={16} />, label: "Upload file" },
            { icon: <AddLarge size={16} />, label: "New folder" },
          ],
        },
      ],
    },

    settings: {
      title: "Settings",
      sections: [
        {
          title: "Account",
          items: [
            { icon: <UserIcon size={16} />, label: "Profile settings" },
            { icon: <Security size={16} />, label: "Security" },
            { icon: <Notification size={16} />, label: "Notifications" },
          ],
        },
      ],
    },
  };

  return contentMap[activeSection] || contentMap.dashboard;
}

/* ---------------------------- Left Icon Nav Rail -------------------------- */

function IconNavButton({
  children,
  isActive = false,
  onClick,
  title,
}: {
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      className={`flex items-center justify-center rounded-lg size-9 transition-all duration-300 relative group
        ${isActive ? "bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]" : "hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200"}`}
      onClick={onClick}
      title={title}
    >
      {isActive && (
        <span className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-white rounded-r" />
      )}
      {children}
    </button>
  );
}

function IconNavigation({
  activeSection,
  onSectionChange,
}: {
  activeSection: string;
  onSectionChange: (section: string) => void;
}) {
  const items = [
    { id: "dashboard", icon: <Dashboard size={16} />, label: "Dashboard" },
    { id: "tasks", icon: <Task size={16} />, label: "Tasks" },
    { id: "projects", icon: <Folder size={16} />, label: "Projects" },
    { id: "calendar", icon: <CalendarIcon size={16} />, label: "Calendar" },
    { id: "teams", icon: <UserMultiple size={16} />, label: "Teams" },
    { id: "analytics", icon: <Analytics size={16} />, label: "Analytics" },
    { id: "files", icon: <DocumentAdd size={16} />, label: "Files" },
  ];

  return (
    <aside className="bg-zinc-950/60 backdrop-blur-md flex flex-col gap-3 items-center p-3 w-14 h-full min-h-screen border-r border-zinc-800/40 shrink-0">
      {/* Logo Indicator */}
      <div className="mb-2 size-8 flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20 rounded-md">
        <div className="size-2 rounded-full bg-indigo-400" />
      </div>

      {/* Nav icons */}
      <div className="flex flex-col gap-2 w-full items-center">
        {items.map((item) => (
          <IconNavButton
            key={item.id}
            isActive={activeSection === item.id}
            onClick={() => onSectionChange(item.id)}
            title={item.label}
          >
            {item.icon}
          </IconNavButton>
        ))}
      </div>

      <div className="flex-1" />

      {/* Bottom Settings / Avatar */}
      <div className="flex flex-col gap-3.5 w-full items-center mb-1">
        <IconNavButton isActive={activeSection === "settings"} onClick={() => onSectionChange("settings")} title="Settings">
          <SettingsIcon size={16} />
        </IconNavButton>
        <AvatarCircle />
      </div>
    </aside>
  );
}

/* ------------------------------ Right Sidebar ----------------------------- */

function SectionTitle({
  title,
  onToggleCollapse,
  isCollapsed,
}: {
  title: string;
  onToggleCollapse: () => void;
  isCollapsed: boolean;
}) {
  if (isCollapsed) {
    return (
      <div className="w-full flex justify-center transition-all duration-300">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex items-center justify-center rounded-lg size-8 hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
          aria-label="Expand sidebar"
        >
          <ChevronDownIcon size={14} className="rotate-180" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden transition-all duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-zinc-200 tracking-wide uppercase px-1">
          {title}
        </h2>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex items-center justify-center rounded-lg size-8 hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
          aria-label="Collapse sidebar"
        >
          <ChevronDownIcon size={14} className="-rotate-90" />
        </button>
      </div>
    </div>
  );
}

function DetailSidebar({ activeSection }: { activeSection: string }) {
  const { user } = useUser();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);
  const content = getSidebarContent(activeSection);

  const toggleExpanded = (itemKey: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemKey)) next.delete(itemKey);
      else next.add(itemKey);
      return next;
    });
  };

  const toggleCollapse = () => setIsCollapsed((s) => !s);

  return (
    <aside
      className={`bg-zinc-950/30 backdrop-blur-md flex flex-col gap-4 items-start p-4 transition-all duration-500 h-full min-h-screen border-r border-zinc-800/40 shrink-0 ${
        isCollapsed ? "w-14 min-w-14 !px-2 justify-center items-center" : "w-60"
      }`}
      style={{ transitionTimingFunction: softSpringEasing }}
    >
      {!isCollapsed && <BrandBadge />}

      <SectionTitle title={content.title} onToggleCollapse={toggleCollapse} isCollapsed={isCollapsed} />
      <SearchContainer isCollapsed={isCollapsed} />

      <div
        className={`flex flex-col w-full overflow-y-auto transition-all duration-500 flex-1 ${
          isCollapsed ? "gap-2 items-center" : "gap-4"
        }`}
        style={{ transitionTimingFunction: softSpringEasing }}
      >
        {content.sections.map((section, index) => (
          <MenuSection
            key={`${activeSection}-${index}`}
            section={section}
            expandedItems={expandedItems}
            onToggleExpanded={toggleExpanded}
            isCollapsed={isCollapsed}
          />
        ))}
      </div>

      {!isCollapsed && (
        <div className="w-full mt-auto pt-3 border-t border-zinc-800/40">
          <div className="flex items-center gap-2.5 px-1 py-1">
            <AvatarCircle />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-zinc-200 truncate">
                {user?.firstName || "Soujanya"}
              </span>
              <span className="text-[10px] text-zinc-500 truncate">
                {user?.primaryEmailAddress?.emailAddress || "Admin Console"}
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

/* ------------------------------ Menu Elements ---------------------------- */

function MenuItem({
  item,
  isExpanded,
  onToggle,
  onItemClick,
  isCollapsed,
}: {
  item: MenuItemT;
  isExpanded?: boolean;
  onToggle?: () => void;
  onItemClick?: () => void;
  isCollapsed?: boolean;
}) {
  const handleClick = () => {
    if (item.hasDropdown && onToggle) onToggle();
    else onItemClick?.();
  };

  const itemClass = item.isActive
    ? "bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500 font-medium"
    : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200";

  return (
    <div
      className={`relative shrink-0 transition-all duration-300 ${
        isCollapsed ? "w-full flex justify-center" : "w-full"
      }`}
    >
      <div
        className={`rounded-md cursor-pointer transition-all duration-300 flex items-center relative group ${itemClass} ${
          isCollapsed ? "size-9 justify-center" : "w-full h-9 px-3 py-1.5"
        }`}
        onClick={handleClick}
        title={isCollapsed ? item.label : undefined}
      >
        <div className="flex items-center justify-center shrink-0 text-zinc-400 group-hover:text-zinc-200 w-5 h-5">
          {item.icon}
        </div>

        <div
          className={`flex-1 relative transition-opacity duration-300 overflow-hidden ${
            isCollapsed ? "opacity-0 w-0" : "opacity-100 ml-2.5"
          }`}
        >
          <div className="text-xs leading-none truncate">
            {item.label}
          </div>
        </div>

        {item.hasDropdown && (
          <div
            className={`flex items-center justify-center shrink-0 transition-opacity duration-300 ${
              isCollapsed ? "opacity-0 w-0" : "opacity-100 ml-1.5"
            }`}
          >
            <ChevronDownIcon
              size={12}
              className={`text-zinc-500 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SubMenuItem({ item, onItemClick }: { item: MenuItemT; onItemClick?: () => void }) {
  return (
    <div className="w-full pl-8 pr-1 py-0.5">
      <div
        className="h-8 w-full rounded-md cursor-pointer transition-all duration-200 hover:bg-zinc-800/40 flex items-center px-2.5 text-zinc-500 hover:text-zinc-300"
        onClick={onItemClick}
      >
        <div className="flex-1 min-w-0">
          <div className="text-xs truncate">
            {item.label}
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuSection({
  section,
  expandedItems,
  onToggleExpanded,
  isCollapsed,
}: {
  section: MenuSectionT;
  expandedItems: Set<string>;
  onToggleExpanded: (itemKey: string) => void;
  isCollapsed?: boolean;
}) {
  return (
    <div className="flex flex-col w-full gap-1">
      <div
        className={`relative shrink-0 w-full transition-all duration-300 overflow-hidden ${
          isCollapsed ? "h-0 opacity-0" : "h-7 opacity-100 mt-2"
        }`}
      >
        <div className="flex items-center h-7 px-3">
          <div className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest leading-none">
            {section.title}
          </div>
        </div>
      </div>

      {section.items.map((item, index) => {
        const itemKey = `${section.title}-${index}`;
        const isExpanded = expandedItems.has(itemKey);
        return (
          <div key={itemKey} className="w-full flex flex-col gap-0.5">
            <MenuItem
              item={item}
              isExpanded={isExpanded}
              onToggle={() => onToggleExpanded(itemKey)}
              onItemClick={() => {}}
              isCollapsed={isCollapsed}
            />
            {isExpanded && item.children && !isCollapsed && (
              <div className="flex flex-col gap-0.5 mt-0.5">
                {item.children.map((child, childIndex) => (
                  <SubMenuItem
                    key={`${itemKey}-${childIndex}`}
                    item={child}
                    onItemClick={() => {}}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------------- Layout -------------------------------- */

export function TwoLevelSidebar({
  activeSection = "dashboard",
  onSectionChange,
}: {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}) {
  const [internalSection, setInternalSection] = useState(activeSection);
  const handleChange = (section: string) => {
    setInternalSection(section);
    onSectionChange?.(section);
  };

  return (
    <div className="flex flex-row h-full min-h-screen shrink-0">
      <IconNavigation activeSection={internalSection} onSectionChange={handleChange} />
      <DetailSidebar activeSection={internalSection} />
    </div>
  );
}

export function Frame760() {
  return (
    <div className="bg-[#1a1a1a] min-h-screen flex items-center justify-center p-4">
      <TwoLevelSidebar />
    </div>
  );
}

export default Frame760;
