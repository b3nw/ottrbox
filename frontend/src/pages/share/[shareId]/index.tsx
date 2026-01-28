import { ActionIcon, Box, Button, Group, Text, Title, Tooltip } from "@mantine/core";
import { useModals } from "@mantine/modals";
import { GetServerSidePropsContext } from "next";
import { useEffect } from "react";
import { FormattedMessage } from "react-intl";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { TbLayoutList, TbPhoto } from "react-icons/tb";
import Meta from "../../../components/Meta";
import DownloadAllButton from "../../../components/share/DownloadAllButton";
import FileList from "../../../components/share/FileList";
import FileGallery from "../../../components/share/FileGallery";
import showEnterPasswordModal from "../../../components/share/showEnterPasswordModal";
import showErrorModal from "../../../components/share/showErrorModal";
import useTranslate from "../../../hooks/useTranslate.hook";
import shareService from "../../../services/share.service";
import { Share as ShareType } from "../../../types/share.type";
import toast from "../../../utils/toast.util";
import { byteToHumanSizeString } from "../../../utils/fileSize.util";
import { AxiosError } from "axios";
import mime from "mime-types";
import { FileMetaData } from "../../../types/File.type";

// Helper function to check if file is an image
const isImageFile = (fileName: string): boolean => {
  const mimeType = mime.lookup(fileName) || "";
  return mimeType.startsWith("image/");
};

export function getServerSideProps(context: GetServerSidePropsContext) {
  return {
    props: { shareId: context.params!.shareId },
  };
}

const Share = ({ shareId }: { shareId: string }) => {
  const router = useRouter();
  const modals = useModals();
  const { data: share, error, refetch, isLoading } = useQuery<ShareType>({
    queryKey: ["share", shareId],
    retry: false,
    queryFn: () => shareService.get(shareId)
  });

  const t = useTranslate();

  // Filter files to get only images
  const imageFiles = share?.files?.filter((file: FileMetaData) => isImageFile(file.name)) || [];

  // Default to gallery view when there are images, unless explicitly set to list
  const isGalleryView = imageFiles.length > 0 && router.query.view !== "list";

  const getShareToken = async (password?: string) => {
    await shareService
      .getShareToken(shareId, password)
      .then(() => {
        modals.closeAll();
        refetch();
      })
      .catch((e) => {
        const { error } = e.response.data;
        if (error == "share_max_views_exceeded") {
          showErrorModal(
            modals,
            t("share.error.visitor-limit-exceeded.title"),
            t("share.error.visitor-limit-exceeded.description"),
            "go-home",
          );
        } else if (error == "share_password_required") {
          showEnterPasswordModal(modals, getShareToken);
        } else {
          toast.axiosError(e);
        }
      });
  };

  useEffect(() => {
    if (!(error instanceof AxiosError) || !error.response) {
      return;
    }

    const { data: errorData, status: errorStatus } = error.response;
    if (errorStatus == 404) {
      if (errorData.error == "share_removed") {
        showErrorModal(
          modals,
          t("share.error.removed.title"),
          errorData.message,
          "go-home",
        );
      } else {
        showErrorModal(
          modals,
          t("share.error.not-found.title"),
          t("share.error.not-found.description"),
          "go-home",
        );
      }
    } else if (errorData.error == "share_password_required") {
      showEnterPasswordModal(modals, getShareToken);
    } else if (errorData.error == "private_share") {
      showErrorModal(
        modals,
        t("share.error.access-denied.title"),
        t("share.error.access-denied.description"),
        "go-home",
      );
    } else if (errorData.error == "share_token_required") {
      getShareToken();
    } else {
      showErrorModal(
        modals,
        t("common.error"),
        t("common.error.unknown"),
        "go-home",
      );
    }
  }, [error])

  return (
    <>
      <Meta
        title={t("share.title", { shareId: share?.name || shareId })}
        description={t("share.description")}
      />

      <Group position="apart" mb="lg">
        <Box style={{ maxWidth: "70%" }}>
          <Title order={3}>{share?.name || share?.id}</Title>
          <Text size="sm">{share?.description}</Text>
          {share?.files?.length > 0 && (
            <Text size="sm" color="dimmed" mt={5}>
              <FormattedMessage
                id="share.fileCount"
                values={{
                  count: share?.files?.length || 0,
                  size: byteToHumanSizeString(
                    share?.files?.reduce(
                      (total: number, file: { size: string }) =>
                        total + parseInt(file.size),
                      0,
                    ) || 0,
                  ),
                }}
              />
            </Text>
          )}
        </Box>

        <Group spacing="xs" align="flex-end">
          {imageFiles.length > 0 && (
            <Group spacing={0}>
              <Tooltip label={t("share.view.toggle")} position="bottom">
                <ActionIcon
                  onClick={() => {
                    if (isGalleryView) {
                      router.push({
                        pathname: router.pathname,
                        query: { ...router.query, view: "list" },
                      });
                    } else {
                      const { view, ...query } = router.query;
                      router.push({
                        pathname: router.pathname,
                        query,
                      });
                    }
                  }}
                  variant={isGalleryView ? "filled" : "light"}
                  aria-label={isGalleryView ? t("share.view.list") : t("share.view.gallery")}
                >
                  {isGalleryView ? <TbLayoutList size={20} /> : <TbPhoto size={20} />}
                </ActionIcon>
              </Tooltip>
            </Group>
          )}
          {share?.files.length > 1 && <DownloadAllButton shareId={shareId} />}
        </Group>
      </Group>

      {isGalleryView ? (
        share && imageFiles.length > 0 ? (
          <FileGallery files={imageFiles} share={share} />
        ) : (
          <Box style={{ textAlign: "center", padding: "40px 20px" }}>
            <Text color="dimmed">{t("share.gallery.noImages")}</Text>
            <Button
              variant="light"
              mt="md"
              onClick={() => {
                router.push({
                  pathname: router.pathname,
                  query: { ...router.query, view: "list" },
                });
              }}
            >
              {t("share.view.list")}
            </Button>
          </Box>
        )
      ) : (
        <FileList
          files={share?.files || []}
          share={share}
          isLoading={isLoading}
        />
      )}
    </>
  );
};

export default Share;
