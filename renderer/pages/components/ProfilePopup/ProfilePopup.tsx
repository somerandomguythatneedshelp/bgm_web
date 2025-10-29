"use client";

import { useState, useEffect } from "react";
import { parseStrToLocale } from "../../utils/Utils";
import SettingsUi from "../Settings/Settings";

export default function ProfilePopup({ name }) {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<"main" | "profile" | "settings">("main");

  const [localeSettings, setLocaleSettings] = useState("Loading...");
  const [localeProfile, setLocaleProfile] = useState("Loading...");
  const [localeLogOut, setLocaleLogOut] = useState("Loading...");
  
  useEffect(() => {
    (async () => { 
      setLocaleSettings(await parseStrToLocale("settings.title"));
      setLocaleProfile(await parseStrToLocale("settings.profile"));
      setLocaleLogOut(await parseStrToLocale("settings.logout"));
    })();
  }, []);

  const sendMessage = (payload: string) => {
    console.log("Message:", payload);
  };

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
          <svg height="32" width="32" viewBox="0 0 1024 1024" className="icon">
            <path
              fill="#FFCE8B"
              d="M1021.103385 510.551692A510.551692 510.551692 0 1 1 510.551692 0a510.551692 510.551692 0 0 1 510.551693 510.551692"
            />
            <path
              fill="#644646"
              d="M809.99026 493.192935v315.26567H494.979866a317.052601 317.052601 0 0 1-66.626996-7.147724V493.192935z"
            />
            <path d="M494.979866 808.458605h-66.626996v-7.147724a317.052601 317.052601 0 0 0 66.626996 7.147724" />
            <path
              fill="#644646"
              d="M809.99026 493.192935H428.35287v308.117946A315.010394 315.010394 0 0 1 178.693092 493.192935a310.670705 310.670705 0 0 1 21.953723-115.639958A314.755118 314.755118 0 0 1 494.979866 178.693092a308.373222 308.373222 0 0 1 82.96465 11.232138 313.989291 313.989291 0 0 1 232.045744 304.033532"
            />
            <path
              fill="#C7F4F1"
              d="M758.935091 959.581906a510.551692 510.551692 0 0 1-512.338624-9.18993 268.55019 268.55019 0 0 1 512.338624 9.18993"
            />
            <path
              fill="#F7BEA9"
              d="M581.263102 727.02561v86.793788a68.924478 68.924478 0 0 1-137.593681 0v-91.133477a184.309161 184.309161 0 0 0 74.285271 15.571826 178.693092 178.693092 0 0 0 63.30841-11.232137"
            />
            <path
              fill="#FBD1BB"
              d="M700.987474 390.572045v163.121266a195.796574 195.796574 0 0 1-119.724372 183.798609 172.566472 172.566472 0 0 1-137.593681-4.850241 197.072953 197.072953 0 0 1-108.747511-178.693093v-163.376541a189.92523 189.92523 0 0 1 183.032782-195.796574 176.39561 176.39561 0 0 1 129.424854 57.437065 201.667919 201.667919 0 0 1 53.607928 138.359509"
            />
            <path
              fill="#FBD1BB"
              d="M370.405253 553.182759a43.396894 43.396894 0 1 1-43.396894-41.099411 42.37579 42.37579 0 0 1 43.396894 41.099411"
            />
            <path
              fill="#F49F83"
              d="M605.769583 590.963584v2.042207a70.966685 70.966685 0 1 1-141.93337 0v-2.042207"
            />
            <path
              fill="#030303"
              d="M499.064279 517.699416a18.890413 18.890413 0 1 1-18.890412-18.890412 18.890413 18.890413 0 0 1 18.890412 18.890412M619.043927 517.699416a18.890413 18.890413 0 1 1-18.890412-18.890412 18.890413 18.890413 0 0 1 18.890412 18.890412"
            />
            <path
              fill="#644646"
              d="M796.46064 401.038354a224.387469 224.387469 0 0 1-282.590362-28.590894 224.132193 224.132193 0 0 1-312.202359 5.105517A314.755118 314.755118 0 0 1 494.979866 178.693092a308.373222 308.373222 0 0 1 82.96465 11.232138 316.031498 316.031498 0 0 1 218.516124 211.878952"
            />
          </svg>
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
