import { Button, Host, Menu } from "@expo/ui/swift-ui";
import { disabled, frame, labelStyle, tint } from "@expo/ui/swift-ui/modifiers";
import { bookTheme } from "@/lib/theme/book-theme";

export interface HeadingParagraphStyleMenuProps {
  headingActive: boolean;
  headingDisabled: boolean;
  /** 0 = body, 1–4 = H1–H4; shown with a checkmark in the menu. */
  selectedLevel: number;
  onApplyLevel: (level: number) => void;
}

function rowLabel(isSelected: boolean, title: string) {
  return isSelected ? `${title} \u2713` : title;
}

export function HeadingParagraphStyleMenu({
  headingActive,
  headingDisabled,
  selectedLevel,
  onApplyLevel,
}: HeadingParagraphStyleMenuProps) {
  return (
    <Host matchContents style={{ width: 44, height: 44 }}>
      <Menu
        label="Paragraph style"
        systemImage="textformat.size"
        modifiers={[
          frame({ width: 44, height: 44 }),
          labelStyle("iconOnly"),
          tint(headingActive ? bookTheme.accent : bookTheme.icon),
          ...(headingDisabled ? [disabled(true)] : []),
        ]}
      >
        <Button
          label={rowLabel(selectedLevel === 0, "Body")}
          onPress={() => onApplyLevel(0)}
        />
        <Button
          label={rowLabel(selectedLevel === 1, "Heading 1")}
          onPress={() => onApplyLevel(1)}
        />
        <Button
          label={rowLabel(selectedLevel === 2, "Heading 2")}
          onPress={() => onApplyLevel(2)}
        />
        <Button
          label={rowLabel(selectedLevel === 3, "Heading 3")}
          onPress={() => onApplyLevel(3)}
        />
        <Button
          label={rowLabel(selectedLevel === 4, "Heading 4")}
          onPress={() => onApplyLevel(4)}
        />
      </Menu>
    </Host>
  );
}
