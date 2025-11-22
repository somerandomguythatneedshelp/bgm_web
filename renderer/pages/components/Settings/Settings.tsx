import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { parseStrToLocale } from "../../utils/Utils";

// A simple toggle switch component
const ToggleSwitch = ({ isEnabled, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-white/40 ${
        isEnabled ? "bg-white-500" : "bg-black/30 border border-white/20"
      }`}
    >
      <span
        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${
          isEnabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
};

export default function SettingsUi({ onBack, sendMessage = () => { console.error("sendMessage was not provided to SettingsUi!"); } }) {
  const [localeTitle, setLocaleTitle] = useState("Loading...");
  const [localeLanguage, setLocaleLanguage] = useState("Loading...");
  const [localeSave, setLocaleSave] = useState("Loading...");
  const [localeEnableAutoplayFeature, setLocaleEnableFeature] = useState("Loading...");
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false); 
  const [localeAutoplayDescription, setLocaleAutoplayDescription] = useState("Loading...");
  const [localePresetDescription, setLocalePresetDescription] = useState("Loading...");
  const [preset, setPreset] = useState("");
  const [localePresetNone, setLocalePresetNone] = useState("Loading...");
  const [localePresetBassBoost, setLocalePresetBassBoost] = useState("Loading...");
  const [loaclePresetVocalBass, setLocalePresetVocalBass] = useState("Loading...");
  const [localePresetHipHop, setLocalePresetHipHop] = useState("Loading...");
  const [localePresetRock, setLocalePresetRock] = useState("Loading...");
  const [localePresetAcoustic, setLocalePresetAcoustic] = useState("Loading...");
  const [localePresetDance, setLocalePresetDance] = useState("Loading...");
  const [localePresetClassical, setLocalePresetClassical] = useState("Loading...");
  const [localePresetLateNight, setLocalePresetLateNight] = useState("Loading...");

  const [selectedLanguage, setSelectedLanguage] = useState("en");

  useEffect(() => {
    (async () => {
      setLocaleTitle(await parseStrToLocale("settings.title"));
      setLocaleLanguage(await parseStrToLocale("settings.language"));
      setLocaleSave(await parseStrToLocale("settings.save"));
      setLocaleEnableFeature(await parseStrToLocale("settings.enable_auto_play")); 
      setLocaleAutoplayDescription(await parseStrToLocale("settings.auto_play_description"));
      setLocalePresetDescription(await parseStrToLocale("settings.preset_description"));

      setLocalePresetNone(await parseStrToLocale("presets.preset_none"));
      setLocalePresetBassBoost(await parseStrToLocale("presets.preset_bass_boost"));
      setLocalePresetVocalBass(await parseStrToLocale("presets.preset_vocal_bass"));
      setLocalePresetHipHop(await parseStrToLocale("presets.preset_hip_hop"));
      setLocalePresetRock(await parseStrToLocale("presets.preset_rock"));
      setLocalePresetAcoustic(await parseStrToLocale("presets.preset_acoustic"));
      setLocalePresetDance(await parseStrToLocale("presets.preset_dance"));
      setLocalePresetClassical(await parseStrToLocale("presets.preset_classical"));
      setLocalePresetLateNight(await parseStrToLocale("presets.preset_late_night"));
    })();
  }, []);

  const handleSave = async () => {
    //sendMessage(`SaveSettings: ${JSON.stringify({ selectedLanguage, autoPlayEnabled })}`);

    try {
      const result = await (window as any).electronAPI.WriteLang(selectedLanguage);
      if (result.success) {
        console.log("Successfully saved language to registry:", result.value);
      } else {
        console.error("Failed to save language to registry:", result.error);
      }
    } catch (error) {
      console.error("Error calling WriteLang:", error);
    }

    const daddy = await (window as any).electronAPI.restartApp(); 
  };

  useEffect(() => {
    (async () => {
    try {
      const daddy = await (window as any).electronAPI.ReadLang();
      if (daddy.success) {
        setSelectedLanguage(daddy.value);
      } else {
        console.error("Failed to read language from registry:", daddy.error);
      }
    } catch (error) {
      console.error("Error calling ReadLang:", error);
    }

    // now for eq

    try {
      const eqResult = await (window as any).electronAPI.ReadEq();
      if (eqResult.success) {
        console.log("Successfully read EQ settings:", eqResult.value);
        setPreset(eqResult.value);
      } else {
        console.error("Failed to read EQ settings:", eqResult.error);
      }
    } catch (error) {
      console.error("Error calling ReadEq:", error);
    }

    })();
  }, []);

  const SetPreset = async (preset: string) => {
    const result = await (window as any).electronAPI.WriteEq(preset);
    if (result.success) {
      setPreset(preset);
      sendMessage(`daddy: ${preset}`);
      console.log("Successfully saved EQ preset:", result.value);
    } else {
      console.error("Failed to save EQ preset:", result.error);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-4xl h-[30rem] bg-white/0 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl flex flex-col p-8 text-white"
    >
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <button
          onClick={onBack}
          className="p-3 rounded-full hover:bg-white/10 transition-all duration-300 hover:scale-110"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          {localeTitle}
        </h1>
        <div className="w-12"></div>
      </div>

      <div className="flex flex-col gap-6 flex-grow">
        <div>
          <label className="block mb-2 text-sm text-gray-400">{localeLanguage}</label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full p-4 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/40 transition-all appearance-none"
            style={{ 
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 1rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.25em',
            }}
          >

            <option value="en" className="bg-neutral-800">English</option>
            <option value="de" className="bg-neutral-800">Deutsch</option>
            <option value="sv-SE" className="bg-neutral-800">svenska</option>
            <option value="fr" className="bg-neutral-800">Français</option>
            <option value="dutch" className="bg-neutral-800">Nederlands</option>
            <option value="ur" className="bg-neutral-800">اردو</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 text-sm text-gray-400">{localePresetDescription}</label>
          <select
            value={preset}
            onChange={(e) => SetPreset(e.target.value)}
            className="w-full p-4 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/40 transition-all appearance-none"
            style={{ 
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 1rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.25em',
            }}
          >

            <option value="none" className="bg-neutral-800">{localePresetNone}</option>
            <option value="bass_boost" className="bg-neutral-800">{localePresetBassBoost}</option>
            <option value="vocal_boost" className="bg-neutral-800">{loaclePresetVocalBass}</option> {/* stfu and leave me alone */}
            <option value="hip_hop" className="bg-neutral-800">{localePresetHipHop}</option>
            <option value="rock" className="bg-neutral-800">{localePresetRock}</option>
            <option value="acoustic" className="bg-neutral-800">{localePresetAcoustic}</option>
            <option value="dance" className="bg-neutral-800">{localePresetDance}</option>
            <option value="classical" className="bg-neutral-800">{localePresetClassical}</option>
            <option value="late_night" className="bg-neutral-800">{localePresetLateNight}</option>


          </select>
        </div>

        <div className="flex items-center justify-between py-2">
          <label className="block text-sm text-gray-400">{localeEnableAutoplayFeature}</label>
          <label className="text-sm text-gray-500">{localeAutoplayDescription}</label>
          <ToggleSwitch 
            isEnabled={autoPlayEnabled} 
            onToggle={() => setAutoPlayEnabled(!autoPlayEnabled)} 
          />
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-white/10 flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-white/40 to-white/20 hover:from-white/60 hover:to-white/30 text-white font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-white/30"
        >
          {localeSave}
        </button>
      </div>
    </motion.div>
  );
}