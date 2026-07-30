'use client'

import { useState, useId } from 'react'

interface Tab {
  id: string
  label: string
  content: React.ReactNode
}

interface TabbedContainerProps {
  tabs: Tab[]
  defaultTab?: string
}

export default function TabbedContainer({ tabs, defaultTab }: TabbedContainerProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '')
  const baseId = useId()

  return (
    <div className="tabbed-container">
      <div className="tab-navigation" role="tablist" aria-label="Content sections">
        {tabs.map(tab => {
          const selected = activeTab === tab.id
          return (
            <button
              key={tab.id}
              id={`${baseId}-tab-${tab.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              className={`tab-button ${selected ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(event) => {
                const currentIndex = tabs.findIndex(t => t.id === activeTab)
                if (event.key === 'ArrowRight') {
                  event.preventDefault()
                  const next = tabs[(currentIndex + 1) % tabs.length]
                  setActiveTab(next.id)
                } else if (event.key === 'ArrowLeft') {
                  event.preventDefault()
                  const prev = tabs[(currentIndex - 1 + tabs.length) % tabs.length]
                  setActiveTab(prev.id)
                } else if (event.key === 'Home') {
                  event.preventDefault()
                  setActiveTab(tabs[0].id)
                } else if (event.key === 'End') {
                  event.preventDefault()
                  setActiveTab(tabs[tabs.length - 1].id)
                }
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      {tabs.map(tab => (
        <div
          key={`${tab.id}-${activeTab === tab.id}`}
          id={`${baseId}-panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          className="tab-content"
        >
          {activeTab === tab.id ? tab.content : null}
        </div>
      ))}
    </div>
  )
}
