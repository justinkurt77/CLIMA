const fs = require("fs");

const filesToUpdate = [
  "./src/components/ui/report/Step2DetailsForm.jsx",
  "./src/components/ui/report/Step3MapPicker.jsx",
];

const colorReplacements = [
  // Red/Oranges to Greens
  [/#e8604c/gi, "#3F6F23"],
  [/rgba\(232,\s*96,\s*76,\s*0\.4\)/gi, "rgba(63, 111, 35, 0.4)"],
  [/#fff0ee/gi, "#F2F7EF"],
  [/#f0c4bc/gi, "#A8C29D"],
  [/#f0c0b8/gi, "#C7D6BE"],
  [/#faf8f6/gi, "#F9FDF7"],
  [/#fff8f7/gi, "#F9FDF7"],
  [/#fff3f0/gi, "#F2F7EF"],
  [/#f0ece8/gi, "#E8EBE5"],
  [/#ede8e4/gi, "#EAEBDE"],
  // Button gradients
  [
    /linear-gradient\(135deg,\s*#e8604c\s*0%,\s*#f28070\s*100%\)/gi,
    "linear-gradient(135deg, #4aaa1f 0%, #3F6F23 100%)",
  ],
  [
    /linear-gradient\(180deg,\s*rgba\(250,248,246,0\)\s*0%,\s*rgba\(250,248,246,1\)\s*30%\)/gi,
    "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 30%)",
  ],
  // Text colors
  [/#5c4d40/gi, "#1A330B"],
  [/#b09890/gi, "#7B936B"],
  [/#c09890/gi, "#8CA17D"],
  [/#d4c4bc/gi, "#A2B099"],

  // Keep error states explicitly red by using class/variable match if needed?
  // I will just let errors be #3F6F23 (Green) for a second, wait no! Let's do a post-replace for "errors.xxx ? '#3F6F23' : " to "errors.xxx ? '#e8604c' : "
];

// Map Pin stuff in Step 3
const mapPinReplacements = [
  [/#E74C3C/gi, "#3F6F23"],
  [/#F25238/gi, "#3F6F23"],
  [/rgba\(242,\s*82,\s*56,\s*0\.3\)/gi, "rgba(63, 111, 35, 0.3)"],
];

for (const file of filesToUpdate) {
  let content = fs.readFileSync(file, "utf8");

  const rules = file.includes("Step3") ? mapPinReplacements : colorReplacements;
  for (const [regex, replacement] of rules) {
    content = content.replace(regex, replacement);
  }

  // Fix error borders and text back to red
  // Border: errors.description ? "1.5px solid #3F6F23"
  content = content.replace(
    /errors\.(\w+)\s*\?\s*"1\.5px\s*solid\s*#3F6F23"/g,
    'errors.$1 ? "1.5px solid #e8604c"',
  );
  // Text: error text color
  content = content.replace(
    /color:\s*"#3F6F23"(.*?)\s*⚠️\s*\{errors/g,
    'color: "#e8604c"$1 ⚠️ {errors',
  );

  fs.writeFileSync(file, content, "utf8");
}

console.log("Colors replaced successfully!");
