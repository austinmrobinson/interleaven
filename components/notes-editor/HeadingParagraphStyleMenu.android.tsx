import {
  DropdownMenu,
  DropdownMenuItem,
  Host,
  Text,
} from "@expo/ui/jetpack-compose";
import { bookTheme } from "@/lib/theme/book-theme";

export interface HeadingParagraphStyleMenuProps {
  headingActive: boolean;
  headingDisabled: boolean;
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
  const tint = headingActive ? bookTheme.accent : bookTheme.icon;

  return (
    <Host matchContents style={{ minWidth: 36, minHeight: 36 }}>
      <DropdownMenu>
        <DropdownMenu.Trigger>
          <Text
            color={tint}
            style={{
              fontSize: 17,
              fontWeight: "600",
            }}
          >
            A
          </Text>
        </DropdownMenu.Trigger>
        <DropdownMenu.Items>
          <DropdownMenuItem
            enabled={!headingDisabled}
            onClick={() => onApplyLevel(0)}
          >
            <DropdownMenuItem.Text>
              <Text>{rowLabel(selectedLevel === 0, "Body")}</Text>
            </DropdownMenuItem.Text>
          </DropdownMenuItem>
          <DropdownMenuItem
            enabled={!headingDisabled}
            onClick={() => onApplyLevel(1)}
          >
            <DropdownMenuItem.Text>
              <Text>{rowLabel(selectedLevel === 1, "Heading 1")}</Text>
            </DropdownMenuItem.Text>
          </DropdownMenuItem>
          <DropdownMenuItem
            enabled={!headingDisabled}
            onClick={() => onApplyLevel(2)}
          >
            <DropdownMenuItem.Text>
              <Text>{rowLabel(selectedLevel === 2, "Heading 2")}</Text>
            </DropdownMenuItem.Text>
          </DropdownMenuItem>
          <DropdownMenuItem
            enabled={!headingDisabled}
            onClick={() => onApplyLevel(3)}
          >
            <DropdownMenuItem.Text>
              <Text>{rowLabel(selectedLevel === 3, "Heading 3")}</Text>
            </DropdownMenuItem.Text>
          </DropdownMenuItem>
          <DropdownMenuItem
            enabled={!headingDisabled}
            onClick={() => onApplyLevel(4)}
          >
            <DropdownMenuItem.Text>
              <Text>{rowLabel(selectedLevel === 4, "Heading 4")}</Text>
            </DropdownMenuItem.Text>
          </DropdownMenuItem>
        </DropdownMenu.Items>
      </DropdownMenu>
    </Host>
  );
}
