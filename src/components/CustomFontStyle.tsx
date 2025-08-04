import { createReactStyleSpec } from "@blocknote/react";

// Custom font styles for better typography
export const CustomFont = createReactStyleSpec(
  {
    type: "customFont",
    propSchema: "string",
  },
  {
    render: (props) => (
      <span 
        style={{ 
          fontFamily: props.value || "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontWeight: props.value?.includes('Bold') ? '600' : '400',
          letterSpacing: props.value?.includes('Wide') ? '0.05em' : 'normal',
          lineHeight: props.value?.includes('Tight') ? '1.4' : '1.6'
        }} 
        ref={props.contentRef} 
      />
    ),
  }
);

// Font options for bloggers
export const fontOptions = [
  {
    value: "Inter",
    label: "Inter (Modern)",
    desc: "Clean, modern sans-serif perfect for blogs",
    preview: "Inter"
  },
  {
    value: "InterBold",
    label: "Inter Bold",
    desc: "Bold weight for emphasis",
    preview: "Inter Bold"
  },
  {
    value: "InterWide",
    label: "Inter Wide",
    desc: "Spaced letters for elegant headings",
    preview: "Inter Wide"
  },
  {
    value: "Merriweather",
    label: "Merriweather (Serif)",
    desc: "Classic serif for long-form content",
    preview: "Merriweather"
  },
  {
    value: "MerriweatherBold",
    label: "Merriweather Bold",
    desc: "Bold serif for strong statements",
    preview: "Merriweather Bold"
  },
  {
    value: "SourceCodePro",
    label: "Source Code Pro",
    desc: "Monospace for code and technical content",
    preview: "Source Code Pro"
  },
  {
    value: "Poppins",
    label: "Poppins (Friendly)",
    desc: "Warm, friendly sans-serif",
    preview: "Poppins"
  },
  {
    value: "PoppinsBold",
    label: "Poppins Bold",
    desc: "Bold friendly font",
    preview: "Poppins Bold"
  },
  {
    value: "PlayfairDisplay",
    label: "Playfair Display (Elegant)",
    desc: "Elegant serif for sophisticated content",
    preview: "Playfair Display"
  },
  {
    value: "PlayfairDisplayBold",
    label: "Playfair Display Bold",
    desc: "Bold elegant serif",
    preview: "Playfair Display Bold"
  }
];

// Font mapping for actual CSS font-family values
export const fontFamilyMap = {
  "Inter": "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  "InterBold": "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  "InterWide": "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  "Merriweather": "'Merriweather', Georgia, serif",
  "MerriweatherBold": "'Merriweather', Georgia, serif",
  "SourceCodePro": "'Source Code Pro', 'Monaco', 'Menlo', monospace",
  "Poppins": "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  "PoppinsBold": "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  "PlayfairDisplay": "'Playfair Display', Georgia, serif",
  "PlayfairDisplayBold": "'Playfair Display', Georgia, serif"
};

// Get the actual font family for a font option
export const getFontFamily = (fontValue: string): string => {
  return fontFamilyMap[fontValue as keyof typeof fontFamilyMap] || fontFamilyMap["Inter"];
};

// Get font weight for a font option
export const getFontWeight = (fontValue: string): string => {
  if (fontValue.includes('Bold')) return '600';
  return '400';
};

// Get letter spacing for a font option
export const getLetterSpacing = (fontValue: string): string => {
  if (fontValue.includes('Wide')) return '0.05em';
  return 'normal';
}; 