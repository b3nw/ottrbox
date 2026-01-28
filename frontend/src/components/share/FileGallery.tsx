import { ActionIcon, Badge, Box, Button, Container, Group, Image, Stack, Text, TextInput } from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { useRef, useState } from "react";
import { TbDownload, TbLink, TbCopy } from "react-icons/tb";
import { useClipboard } from "@mantine/hooks";
import { useModals } from "@mantine/modals";
import useTranslate from "../../hooks/useTranslate.hook";
import { FileMetaData } from "../../types/File.type";
import { Share } from "../../types/share.type";
import { byteToHumanSizeString } from "../../utils/fileSize.util";
import toast from "../../utils/toast.util";

interface FileGalleryProps {
  files: FileMetaData[];
  share: Share;
}

export const FileGallery = ({ files, share }: FileGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const clipboard = useClipboard();
  const modals = useModals();
  const t = useTranslate();

  const currentFile = files[activeIndex];

  const copyFileLink = (file: FileMetaData) => {
    const link = `${window.location.origin}/api/shares/${share.id}/files/${file.id}`;

    if (window.isSecureContext) {
      clipboard.copy(link);
      toast.success(t("common.notify.copied-link"));
    } else {
      let inputRef: HTMLInputElement | null = null;
      modals.openModal({
        title: t("share.modal.file-link"),
        children: (
          <Stack align="stretch" spacing="md">
            <TextInput
              ref={(node) => { inputRef = node; }}
              variant="filled"
              value={link}
              readOnly
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button
              leftIcon={<TbCopy size={16} />}
              onClick={() => {
                inputRef?.select();
                document.execCommand("copy");
                toast.success(t("common.notify.copied-link"));
                modals.closeAll();
              }}
            >
              {t("common.button.copy") || "Copy"}
            </Button>
          </Stack>
        ),
      });
    }
  };

  const downloadFile = async (file: FileMetaData) => {
    window.location.href = `${window.location.origin}/api/shares/${share.id}/files/${file.id}?download=true`;
  };

  return (
    <Container fluid px={0}>
      <Carousel
        withIndicators
        loop
        onSlideChange={setActiveIndex}
        mx="auto"
        sx={{ maxWidth: "100%", flex: 1 }}
        aria-label={`Image gallery with ${files.length} images`}
        styles={{
          root: { width: "100%" },
          viewport: { borderRadius: 8 },
          control: {
            backgroundColor: "rgba(255, 255, 255, 0.85)",
            border: "none",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
          },
        }}
      >
        {files.map((file) => (
          <Carousel.Slide key={file.id}>
            <Box
              sx={(theme) => ({
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "calc(100vh - 280px)",
                minHeight: "300px",
                maxHeight: "800px",
                backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[6] : "#f5f5f5",
                borderRadius: 8,
                position: "relative",
              })}
            >
              <Image
                src={`/api/shares/${share.id}/files/${file.id}`}
                alt={file.name}
                fit="contain"
                height="100%"
                styles={{
                  root: { height: "100%", display: "flex", alignItems: "center", justifyContent: "center" },
                  imageWrapper: { height: "100%" },
                  figure: { height: "100%" },
                  image: { maxHeight: "100%", objectFit: "contain" },
                }}
              />
            </Box>
          </Carousel.Slide>
        ))}
      </Carousel>

      <Stack spacing="md" mt="lg">
        <Group position="apart" align="flex-start">
          <Stack spacing={4} style={{ flex: 1 }}>
            <Text weight={500} size="md" lineClamp={2}>
              {currentFile.name}
            </Text>
            <Text size="sm" color="dimmed">
              {currentFile.size ? byteToHumanSizeString(parseInt(currentFile.size, 10)) : "-"}
            </Text>
          </Stack>
          <Badge>
            {activeIndex + 1} / {files.length}
          </Badge>
        </Group>

        <Group position="center">
          {!share.hasPassword && (
            <ActionIcon
              size="lg"
              variant="light"
              onClick={() => copyFileLink(currentFile)}
              title={t("share.modal.file-link")}
              aria-label={t("share.modal.file-link")}
            >
              <TbLink size={18} />
            </ActionIcon>
          )}
          <ActionIcon
            size="lg"
            variant="light"
            onClick={() => downloadFile(currentFile)}
            title={t("common.button.download") || "Download"}
            aria-label={t("common.button.download") || "Download"}
          >
            <TbDownload size={18} />
          </ActionIcon>
        </Group>
      </Stack>
    </Container>
  );
};

export default FileGallery;
