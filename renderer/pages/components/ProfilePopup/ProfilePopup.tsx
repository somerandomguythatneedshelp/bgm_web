"use client";

import { useState, useEffect } from "react";
import { parseStrToLocale } from "../../utils/Utils";
import SettingsUi from "../Settings/Settings";

export default function ProfilePopup({ name, sendMessage }) {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<"main" | "profile" | "settings">("main");

  const [localeSettings, setLocaleSettings] = useState("Loading...");
  const [localeProfile, setLocaleProfile] = useState("Loading...");
  const [localeLogOut, setLocaleLogOut] = useState("Loading...");

  const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=transparent&radius=50`;
  
  useEffect(() => {
    (async () => { 
      setLocaleSettings(await parseStrToLocale("settings.title"));
      setLocaleProfile(await parseStrToLocale("settings.profile"));
      setLocaleLogOut(await parseStrToLocale("settings.logout"));
    })();
  }, []);

  return (
    <div className="flex text-[#ccc] text-[0.975rem]">
      <div
        tabIndex={0}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="relative inline-block cursor-pointer rounded-r-[1.2rem] px-[0.225rem] py-0 outline-none"
      >
        {/* Header */}
        <div className="flex flex-row items-center gap-3">
          <p className="tracking-[1px] font-semibold py-[0.625rem] pl-[0.825rem]">
            {name}
          </p>
          <img 
  src={avatarUrl} 
  alt={name} 
  className="h-8 w-8 rounded-full bg-neutral-800" 
/>
        </div>

        {/* Popup */}
        {menu === "main" && (
          <div
            className={`absolute right-0 mt-1 w-56 rounded-md bg-neutral-900 shadow-[0_0_0_1px_hsl(0,0%,12%)] p-2 transition-all duration-300 overflow-hidden ${
              open ? "opacity-100 mt-4" : "opacity-0 pointer-events-none"
            }`}
          >
            <ul className="flex flex-col gap-1 overflow-auto scrollbar-hide">
              <li
                className="px-4 py-2 rounded-md hover:bg-neutral-700/20 transition-colors cursor-pointer"
                onClick={() => {
                  setMenu("settings");
                  setOpen(false);
                }}
              >
                {localeSettings}
              </li>
              <li
                className="px-4 py-2 rounded-md hover:bg-neutral-700/20 transition-colors cursor-pointer"
                onClick={() => {
                  //setMenu("profile");
                  //setOpen(false);
                }}
              >
                {localeProfile}
              </li>
              <hr className="my-2 border-dashed border-neutral-700" />
              <li className="px-4 py-2 rounded-md hover:bg-[#962434] transition-colors cursor-pointer">
                {localeLogOut}
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Settings Overlay */}
      {menu === "settings" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <SettingsUi
            sendMessage={sendMessage}
            onBack={() => setMenu("main")}
          />
        </div>
      )}
    </div>
  );
}
