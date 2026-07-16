import type { ChangeEvent, FC, KeyboardEvent, ReactNode, Ref, RefAttributes } from "react";
import { createContext, isValidElement, useMemo, useState } from "react";
import { ChevronDown, SearchLg } from "@untitledui/icons";
import type { SelectProps as AriaSelectProps } from "react-aria-components";
import { Button as AriaButton, ListBox as AriaListBox, Select as AriaSelect, SelectValue as AriaSelectValue } from "react-aria-components";
import { Avatar } from "@/components/base/avatar/avatar";
import { HintText } from "@/components/base/input/hint-text";
import { Label } from "@/components/base/input/label";
import { cx } from "@/utils/cx";
import { isReactComponent } from "@/utils/is-react-component";
import { ComboBox } from "./combobox";
import { Popover } from "./popover";
import { SelectItem } from "./select-item";

export type SelectItemType = {
    id: string;
    label?: string;
    avatarUrl?: string;
    isDisabled?: boolean;
    supportingText?: string;
    icon?: FC | ReactNode;
};

export interface CommonProps {
    hint?: string;
    label?: string;
    tooltip?: string;
    size?: "sm" | "md";
    placeholder?: string;
}

interface SelectProps extends Omit<AriaSelectProps<SelectItemType>, "children" | "items">, RefAttributes<HTMLDivElement>, CommonProps {
    items?: SelectItemType[];
    popoverClassName?: string;
    placeholderIcon?: FC | ReactNode;
    isSearchable?: boolean;
    searchPlaceholder?: string;
    noResultsText?: string;
    children: ReactNode | ((item: SelectItemType) => ReactNode);
}

interface SelectValueProps {
    isOpen: boolean;
    size: "sm" | "md";
    isFocused: boolean;
    isDisabled: boolean;
    placeholder?: string;
    ref?: Ref<HTMLButtonElement>;
    placeholderIcon?: FC | ReactNode;
}

export const sizes = {
    sm: { root: "py-2 px-3", shortcut: "pr-2.5" },
    md: { root: "py-2.5 px-3.5", shortcut: "pr-3" },
};

const SelectValue = ({ isOpen, isFocused, isDisabled, size, placeholder, placeholderIcon, ref }: SelectValueProps) => {
    return (
        <AriaButton
            ref={ref}
            className={cx(
                "relative flex w-full cursor-pointer items-center rounded-lg bg-primary shadow-xs ring-1 ring-primary outline-hidden transition duration-100 ease-linear ring-inset",
                (isFocused || isOpen) && "ring-2 ring-brand",
                isDisabled && "cursor-not-allowed bg-disabled_subtle text-disabled",
            )}
        >
            <AriaSelectValue<SelectItemType>
                className={cx(
                    "flex h-max w-full items-center justify-start gap-2 truncate text-left align-middle",

                    // Icon styles
                    "*:data-icon:size-5 *:data-icon:shrink-0 *:data-icon:text-fg-quaternary in-disabled:*:data-icon:text-fg-disabled",

                    sizes[size].root,
                )}
            >
                {(state) => {
                    const Icon = state.selectedItem?.icon || placeholderIcon;
                    return (
                        <>
                            {state.selectedItem?.avatarUrl ? (
                                <Avatar size="xs" src={state.selectedItem.avatarUrl} alt={state.selectedItem.label} />
                            ) : isReactComponent(Icon) ? (
                                <Icon data-icon aria-hidden="true" />
                            ) : isValidElement(Icon) ? (
                                Icon
                            ) : null}

                            {state.selectedItem ? (
                                <section className="flex w-full gap-2 truncate">
                                    <p className="truncate text-md font-medium text-primary">{state.selectedItem?.label}</p>
                                    {state.selectedItem?.supportingText && <p className="text-md text-tertiary">{state.selectedItem?.supportingText}</p>}
                                </section>
                            ) : (
                                <p className={cx("text-md text-placeholder", isDisabled && "text-disabled")}>{placeholder}</p>
                            )}

                            <ChevronDown
                                aria-hidden="true"
                                className={cx("ml-auto shrink-0 text-fg-quaternary", size === "sm" ? "size-4 stroke-[2.5px]" : "size-5")}
                            />
                        </>
                    );
                }}
            </AriaSelectValue>
        </AriaButton>
    );
};

export const SelectContext = createContext<{ size: "sm" | "md" }>({ size: "sm" });

const getSearchableText = (item: SelectItemType) => [item.label, item.supportingText, item.id].filter(Boolean).join(" ").toLowerCase();

const Select = ({
    placeholder = "Select",
    placeholderIcon,
    size = "sm",
    children,
    items,
    label,
    hint,
    tooltip,
    className,
    isSearchable = true,
    searchPlaceholder = "Search",
    noResultsText = "No results",
    ...rest
}: SelectProps) => {
    const [searchQuery, setSearchQuery] = useState("");
    const { popoverClassName, onOpenChange, onSelectionChange, ...selectProps } = rest;
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();
    const hasItems = Array.isArray(items);
    const filteredItems = useMemo(() => {
        if (!items || !normalizedSearchQuery) {
            return items;
        }

        return items.filter((item) => getSearchableText(item).includes(normalizedSearchQuery));
    }, [items, normalizedSearchQuery]);
    const showNoResults = hasItems && filteredItems?.length === 0;

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setSearchQuery("");
        }

        onOpenChange?.(isOpen);
    };

    const handleSelectionChange: SelectProps["onSelectionChange"] = (key) => {
        setSearchQuery("");
        onSelectionChange?.(key);
    };

    const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
    };

    const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Escape" || event.key === "Tab") {
            return;
        }

        event.stopPropagation();
    };

    return (
        <SelectContext.Provider value={{ size }}>
            <AriaSelect
                {...selectProps}
                aria-label={selectProps["aria-label"] ?? (label ? undefined : placeholder)}
                onOpenChange={handleOpenChange}
                onSelectionChange={handleSelectionChange}
                className={(state) => cx("flex flex-col gap-1.5", typeof className === "function" ? className(state) : className)}
            >
                {(state) => (
                    <>
                        {label && (
                            <Label isRequired={state.isRequired} tooltip={tooltip}>
                                {label}
                            </Label>
                        )}

                        <SelectValue {...state} {...{ size, placeholder }} placeholderIcon={placeholderIcon} />

                        <Popover size={size} className={popoverClassName}>
                            {isSearchable && (
                                <div className="sticky top-0 z-10 border-b border-border-secondary bg-primary p-1.5">
                                    <div className="relative flex items-center rounded-md bg-primary shadow-xs ring-1 ring-primary ring-inset">
                                        <SearchLg className="pointer-events-none absolute left-2.5 size-4 text-fg-quaternary" />
                                        <input
                                            aria-label={searchPlaceholder}
                                            autoFocus
                                            value={searchQuery}
                                            onChange={handleSearchChange}
                                            onKeyDown={handleSearchKeyDown}
                                            onClick={(event) => event.stopPropagation()}
                                            onPointerDown={(event) => event.stopPropagation()}
                                            placeholder={searchPlaceholder}
                                            className="w-full bg-transparent py-2 pr-2.5 pl-8 text-sm text-primary outline-hidden placeholder:text-placeholder disabled:cursor-not-allowed disabled:text-disabled"
                                        />
                                    </div>
                                </div>
                            )}

                            <AriaListBox items={filteredItems} className="size-full outline-hidden">
                                {children}
                            </AriaListBox>

                            {showNoResults && (
                                <div role="status" className="px-3 py-2 text-sm text-tertiary">
                                    {noResultsText}
                                </div>
                            )}
                        </Popover>

                        {hint && <HintText isInvalid={state.isInvalid}>{hint}</HintText>}
                    </>
                )}
            </AriaSelect>
        </SelectContext.Provider>
    );
};

const _Select = Select as typeof Select & {
    ComboBox: typeof ComboBox;
    Item: typeof SelectItem;
};
_Select.ComboBox = ComboBox;
_Select.Item = SelectItem;

export { _Select as Select };
