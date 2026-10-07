'use client';
import { Box, Stack, useTheme } from '@mui/material';
import React, { useState } from 'react';
import { Iconify } from '../iconify';
import { varAlpha } from 'src/theme/styles';

function ElectricPlug() {
  const theme = useTheme();
  return (
    // Plug
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 400,
        }}
      >
        <Stack
          sx={{
            containerType: 'inline-size',
            width: '100%',
            aspectRatio: 4.5,
            // backgroundColor: 'red',
            borderRadius: '1cqw',
            p: '1%',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: theme.palette.grey[400],
            boxShadow: '3px 2px 10px 2px rgba(0,0,0,0.1)',
          }}
          direction="row"
          alignItems="center"
        >
          <PlugSocket />
          <PlugSocket online />
          <PlugSocket online={false} />
          <PlugSocket />
          <Stack sx={{ height: '100%', flex: 1 }}>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="center"
              sx={{ height: '100%' }}
            >
              <Box
                sx={{
                  height: '10%',
                  aspectRatio: 1,
                  backgroundColor: theme.palette.success.main,
                  borderRadius: '50%',
                }}
              />
              <Box
                sx={{
                  containerType: 'inline-size',
                  height: '40%',
                  aspectRatio: 1,
                  borderWidth: '0.3cqw',
                  borderStyle: 'solid',
                  borderColor: theme.palette.grey[400],
                  borderRadius: '50%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  display: 'flex',
                }}
              >
                <Iconify
                  icon="charm:power"
                  width={'85%'}
                  color={theme.palette.grey[400]}
                  sx={{
                    transition: 'all 0.3s',
                  }}
                />
              </Box>
            </Stack>
            <Stack
              sx={{
                containerType: 'inline-size',

                width: '100%',
                aspectRatio: 2.2,
                borderRadius: '3cqw',
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: theme.palette.grey[400],
                overflow: 'hidden',
                flexDirection: 'row',
              }}
            >
              <Stack
                sx={{
                  height: '100%',
                  flex: 1,
                  backgroundColor: '#eee',
                  borderRadius: 1.5,
                  boxShadow: ' 0 0 10px rgba(0,0,0,0.3)',
                }}
                flexDirection="row"
                justifyContent="center"
                spacing="10%"
                alignItems="center"
              >
                {/* Cover */}
                {Array.from({ length: 4 }, (_, i) => (
                  <Box
                    key={i}
                    sx={{
                      backgroundColor: '#bbb',
                      height: '70%',
                      aspectRatio: 1 / 6,
                      borderRadius: 2,
                    }}
                  />
                ))}
              </Stack>
              <Stack
                sx={{ height: '100%', flex: 1 }}
                flexDirection="row"
                alignItems="center"
                justifyContent="center"
                spacing="10%"
              >
                {/* USB Ports */}
                <Box
                  sx={{
                    height: '90%',
                    aspectRatio: 1 / 3,
                    backgroundColor: '#222',
                    display: 'flex',
                    alignItems: 'center',
                    p: 0.3,
                  }}
                >
                  <Box sx={{ width: '50%', height: '97%', backgroundColor: '#fff' }} />
                </Box>
                <Box
                  sx={{
                    height: '90%',
                    aspectRatio: 1 / 3,
                    backgroundColor: '#222',
                    display: 'flex',
                    alignItems: 'center',
                    p: 0.3,
                  }}
                >
                  <Box sx={{ width: '50%', height: '97%', backgroundColor: '#fff' }} />
                </Box>
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}

function PlugSocket({ online = true }: { online?: boolean }) {
  const [isOnline, setIsOnline] = useState<boolean>(online);
  const theme = useTheme();
  return (
    <Stack
      direction="column"
      flex={1}
      alignItems="center"
      justifyContent="center"
      height="100%"
      sx={{ gap: 1 }}
    >
      {/* Socket Plug */}
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{
          height: '100%',
          position: 'relative',
          aspectRatio: 1,
          borderRadius: '50%',
          borderWidth: 2,
          borderStyle: 'solid',
          //   borderColor: theme.palette.grey[400],
          borderColor: isOnline ? theme.palette.success.main : theme.palette.warning.main,
          p: 0.5,
          boxShadow: `
    inset 0 8px 12px rgba(0, 0, 0, 0.
    03),
    inset 0 -8px 12px rgba(0, 0, 0, 0.03),
    inset 8px 0 12px rgba(0, 0, 0, 0.03),
    inset -8px 0 12px rgba(0, 0, 0, 0.03)
  `,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: varAlpha(
              theme.vars.palette[isOnline ? 'success' : 'warning'].mainChannel,
              0.12
            ),
            zIndex: 2,
          }}
        />
        <Stack
          sx={{
            height: '100%',
            aspectRatio: 1,
            borderRadius: '50%',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: theme.palette.grey[400],
            overflow: 'hidden',
          }}
          flexDirection="row"
          alignItems="center"
        >
          <Box
            sx={{
              width: '5%',
              backgroundColor: '#eeededff',
              aspectRatio: 1 / 4,
              // background: `linear-gradient(135deg,#e8f8ef 0%,#d9f2e3 45%,#c9ead7 100%)`,
            }}
          />
          <Stack
            sx={{
              flex: 1,
              height: '100%',
              background: `radial-gradient(circle at 50% 45%,#ffffff 0%,#f5f5f5 45%,#e8e8e8 75%,#666666 100%)`,
              alignItems: 'center',
              justifyContent: 'space-around',
              flexDirection: 'row',
              position: 'relative',
            }}
          >
            {/* TOP CONTACT */}
            <Box
              sx={{
                position: 'absolute',
                top: '-1%',
                left: '50%',
                transform: 'translateX(-50%)',

                height: '16%',
                aspectRatio: 0.8,
                borderRadius: '0 0 18% 18%',

                background: `
        linear-gradient(
          90deg,
          #6f5628 0%,
          #a77c32 12%,
          #e2b75c 35%,
          #f2d17f 52%,
          #d6a84f 75%,
          #8b672d 100%
        )
      `,

                boxShadow: `
        0 2px 2px rgba(0,0,0,0.25),
        inset 0 -2px 2px rgba(70,45,15,0.25)
      `,

                zIndex: 2,

                '&::before': {
                  content: '""',
                  position: 'absolute',

                  left: '8%',
                  top: 0,
                  bottom: 0,

                  width: '13%',

                  background: 'rgba(70, 48, 20, 0.5)',
                  borderRadius: '0 0 2px 2px',
                },

                '&::after': {
                  content: '""',
                  position: 'absolute',

                  left: '38%',
                  top: '4%',
                  bottom: '8%',

                  width: '22%',

                  background: `
          linear-gradient(
            180deg,
            rgba(255,255,255,0.55),
            rgba(255,255,255,0.08)
          )
        `,

                  borderRadius: '0 0 3px 3px',
                },
              }}
            />
            <Box
              sx={{
                height: '14%',
                aspectRatio: 1,
                bgcolor: '#555',
                borderRadius: '50%',
                background: `radial-gradient(circle at 50% 45%,#515151 0%,#414343 45%,#3D3E3E 75%,#2F2F2F 100%)`,
              }}
            />
            <Box
              sx={{
                height: '14%',
                aspectRatio: 1,
                background: `radial-gradient(circle at 50% 45%,#515151 0%,#414343 45%,#3D3E3E 75%,#2F2F2F 100%)`,

                borderRadius: '50%',
              }}
            />
            {/* TOP CONTACT */}
            <Box
              sx={{
                position: 'absolute',
                bottom: '-1%',
                left: '50%',
                transform: 'translateX(-50%)',

                height: '16%',
                aspectRatio: 0.8,
                borderRadius: '18% 18% 0 0',

                background: `
        linear-gradient(
          90deg,
          #6f5628 0%,
          #a77c32 12%,
          #e2b75c 35%,
          #f2d17f 52%,
          #d6a84f 75%,
          #8b672d 100%
        )
      `,

                boxShadow: `
        0 2px 2px rgba(0,0,0,0.25),
        inset 0 -2px 2px rgba(70,45,15,0.25)
      `,

                zIndex: 2,

                '&::before': {
                  content: '""',
                  position: 'absolute',

                  left: '8%',
                  top: 0,
                  bottom: 0,

                  width: '13%',

                  background: 'rgba(70, 48, 20, 0.5)',
                  borderRadius: '0 0 2px 2px',
                },

                '&::after': {
                  content: '""',
                  position: 'absolute',

                  left: '38%',
                  top: '4%',
                  bottom: '8%',

                  width: '22%',

                  background: `
          linear-gradient(
            180deg,
            rgba(255,255,255,0.55),
            rgba(255,255,255,0.08)
          )
        `,

                  borderRadius: '0 0 3px 3px',
                },
              }}
            />
          </Stack>
          <Box
            sx={{
              width: '5%',
              backgroundColor: '#eeededff',
              aspectRatio: 1 / 4,
            }}
          />
          <Box />
        </Stack>
      </Stack>
      {/* Socket Button */}
      <Box
        sx={{
          containerType: 'inline-size',
          height: '30%',
          aspectRatio: 1,
          borderWidth: '0.1cqw',
          borderStyle: 'solid',
          borderColor: isOnline ? theme.palette.success.main : theme.palette.warning.main,
          borderRadius: '50%',
          alignItems: 'center',
          justifyContent: 'center',
          display: 'flex',
        }}
      >
        <Iconify
          icon="charm:power"
          width={'85%'}
          color={isOnline ? theme.palette.success.main : theme.palette.warning.main}
          sx={{
            transition: 'all 0.3s',
          }}
        />
      </Box>
    </Stack>
  );
}

export default ElectricPlug;
