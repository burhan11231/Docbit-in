import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { MoreVertical } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DropdownItem {
  label: string;
  icon?: React.ElementType;
  onClick: () => void;
  danger?: boolean;
}

interface DropdownProps {
  items: DropdownItem[];
  button?: React.ReactNode;
}

export function Dropdown({ items, button }: DropdownProps) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="flex items-center focus:outline-none">
          {button || (
            <div className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
              <MoreVertical className="w-5 h-5" />
            </div>
          )}
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-slate-100 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="px-1 py-1">
            {items.map((item, idx) => (
              <Menu.Item key={idx}>
                {({ active }) => (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      item.onClick();
                    }}
                    className={cn(
                      'group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors',
                      active 
                        ? (item.danger ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-900') 
                        : (item.danger ? 'text-red-600' : 'text-slate-700')
                    )}
                  >
                    {item.icon && (
                      <item.icon
                        className="mr-2 h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    {item.label}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
