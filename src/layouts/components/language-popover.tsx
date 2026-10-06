'use client';

import type { IconButtonProps } from '@mui/material/IconButton';

import { m } from 'framer-motion';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useCallback } from 'react';

import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';

import { varHover } from 'src/components/animate';
import { FlagIcon } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

export type LanguagePopoverProps = IconButtonProps & {
  data?: {
    value: string;
    label: string;
    countryCode: string;
  }[];
};

export function LanguagePopover({ data = [], sx, ...other }: LanguagePopoverProps) {
  const popover = usePopover();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const currentLangValue = (params.lang as string) || data[0].value;
  const currentLang = data.find((lang) => lang.value === currentLangValue) || data[0];

  const handleChangeLang = useCallback(
    (newLang: string) => {
      popover.onClose();
      const newPath = pathname.replace(`/${currentLangValue}`, `/${newLang}`);
      router.push(newPath);
    },
    [popover, pathname, currentLangValue, router]
  );

  return (
    <>
      <IconButton
        component={m.button}
        whileTap="tap"
        whileHover="hover"
        variants={varHover(1.05)}
        onClick={popover.onOpen}
        sx={{
          p: 0,
          width: 40,
          height: 40,
          ...(popover.open && { bgcolor: 'action.selected' }),
          ...sx,
        }}
        {...other}
      >
        <FlagIcon code={currentLang?.countryCode} />
      </IconButton>

      <CustomPopover open={popover.open} anchorEl={popover.anchorEl} onClose={popover.onClose}>
        <MenuList sx={{ width: 160, minHeight: 72 }}>
          {data?.map((option) => (
            <MenuItem
              key={option.value}
              selected={option.value === currentLang?.value}
              onClick={() => handleChangeLang(option.value)}
            >
              <FlagIcon code={option.countryCode} />
              {option.label}
            </MenuItem>
          ))}
        </MenuList>
      </CustomPopover>
    </>
  );
}
