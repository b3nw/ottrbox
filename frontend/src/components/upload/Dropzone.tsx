import { createStyles, Group, Text } from "@mantine/core";
import { Dropzone as MantineDropzone } from "@mantine/dropzone";
import { ForwardedRef, useEffect, useRef } from "react";
import { TbCloudUpload } from "react-icons/tb";
import { FormattedMessage } from "react-intl";
import useTranslate from "../../hooks/useTranslate.hook";
import { FileUpload } from "../../types/File.type";
import { byteToHumanSizeString } from "../../utils/fileSize.util";
import toast from "../../utils/toast.util";

const useStyles = createStyles((theme) => ({
  wrapper: {
    position: "relative",
    marginBottom: 30,
  },

  dropzone: {
    borderWidth: 1,
    paddingBottom: 50,
  },

  icon: {
    color:
      theme.colorScheme === "dark"
        ? theme.colors.dark[3]
        : theme.colors.gray[4],
  },

  control: {
    position: "absolute",
    bottom: -20,
  },
}));

const Dropzone = ({
  title,
  isUploading,
  maxShareSize,
  onFilesChanged,
}: {
  title?: string;
  isUploading: boolean;
  maxShareSize: number;
  onFilesChanged: (files: FileUpload[]) => void;
}) => {
  const t = useTranslate();

  const { classes } = useStyles();
  const openRef = useRef<() => void>();

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Only process paste if not currently uploading
      if (isUploading) return;

      const items = e.clipboardData?.items;
      if (!items || items.length === 0) return;

      const imageFiles: FileUpload[] = [];

      // Convert clipboard items to File objects
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // Only process image items
        if (!item.type.startsWith("image/")) continue;

        const file = item.getAsFile();
        if (!file) continue;

        // Generate filename: screenshot-{timestamp}-{random}.{ext}
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 10);
        const ext = file.type.split("/")[1] || "png";
        const generatedName = `screenshot-${timestamp}-${randomStr}.${ext}`;

        // Create File object with generated name
        const namedFile = new File([file], generatedName, { type: file.type });
        (namedFile as FileUpload).uploadingProgress = 0;
        imageFiles.push(namedFile as FileUpload);
      }

      if (imageFiles.length === 0) {
        toast.error(t("upload.dropzone.notify.noImagesInClipboard"));
        return;
      }

      // Validate total file size
      const fileSizeSum = imageFiles.reduce((n, { size }) => n + size, 0);

      if (fileSizeSum > maxShareSize) {
        toast.error(
          t("upload.dropzone.notify.file-too-big", {
            maxSize: byteToHumanSizeString(maxShareSize),
          }),
        );
        return;
      }

      // Show success message with count
      if (imageFiles.length === 1) {
        toast.success(t("upload.dropzone.notify.imagePasted"));
      } else {
        toast.success(
          t("upload.dropzone.notify.imagesPasted", {
            count: imageFiles.length,
          }),
        );
      }

      // Pass files to parent component
      onFilesChanged(imageFiles);
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [onFilesChanged, maxShareSize, isUploading, t]);

  return (
    <div className={classes.wrapper}>
      <MantineDropzone
        onReject={(e) => {
          toast.error(e[0].errors[0].message);
        }}
        disabled={isUploading}
        openRef={openRef as ForwardedRef<() => void>}
        onDrop={(files: FileUpload[]) => {
          const fileSizeSum = files.reduce((n, { size }) => n + size, 0);

          if (fileSizeSum > maxShareSize) {
            toast.error(
              t("upload.dropzone.notify.file-too-big", {
                maxSize: byteToHumanSizeString(maxShareSize),
              }),
            );
          } else {
            files = files.map((newFile) => {
              newFile.uploadingProgress = 0;
              return newFile;
            });
            onFilesChanged(files);
          }
        }}
        className={classes.dropzone}
        radius="md"
      >
        <div style={{ pointerEvents: "none" }}>
          <Group position="center">
            <TbCloudUpload size={50} />
          </Group>
          <Text align="center" weight={700} size="lg" mt="xl">
            {title || <FormattedMessage id="upload.dropzone.title" />}
          </Text>
          <Text align="center" size="sm" mt="xs" color="dimmed">
            <FormattedMessage
              id="upload.dropzone.description"
              values={{ maxSize: byteToHumanSizeString(maxShareSize) }}
            />
          </Text>
        </div>
      </MantineDropzone>
    </div>
  );
};
export default Dropzone;
