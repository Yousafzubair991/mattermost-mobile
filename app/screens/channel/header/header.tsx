// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, { useCallback, useMemo, useState } from "react";

import ChannelInfoStartButton from "@calls/components/channel_info_start";
import CompassIcon from "@components/compass_icon";
import CustomStatusEmoji from "@components/custom_status/custom_status_emoji";
import type { HeaderRightButton } from "@components/navigation_header/header";
import { ITEM_HEIGHT } from "@components/option_item";
import NavigationHeader from "@components/navigation_header";
import OtherMentionsBadge from "@components/other_mentions_badge";
import RoundedHeaderContext from "@components/rounded_header_context";
import { bottomSheetSnapPoint } from "@utils/helpers";
import { getCallsConfig } from "@calls/state";
import { isTypeDMorGM } from "@utils/channel";
import { preventDoubleTap } from "@utils/tap";
import { typography } from "@utils/typography";
import { useDefaultHeaderHeight } from "@hooks/header";
import { useIntl } from "react-intl";
import { Keyboard, Modal, Platform, Pressable, Text, View } from "react-native";
import { CHANNEL_ACTIONS_OPTIONS_HEIGHT } from "@components/channel_actions/channel_actions";
import { General, Screens } from "@constants";
import { useServerUrl } from "@context/server";
import { useTheme } from "@context/theme";
import { useIsTablet } from "@hooks/device";
import { BOTTOM_SHEET_ANDROID_OFFSET } from "@screens/bottom_sheet";
import ChannelBanner from "@screens/channel/header/channel_banner";
import {
    bottomSheet,
    dismissAllModalsAndPopToScreen,
    dismissBottomSheet,
    popTopScreen,
    showModal,
} from "@screens/navigation";
import { changeOpacity, makeStyleSheetFromTheme } from "@utils/theme";
import ChannelHeaderBookmarks from "./bookmarks";

import QuickActions, { MARGIN, SEPARATOR_HEIGHT } from "./quick_actions";

import type { AvailableScreens } from "@typings/screens/navigation";

type ChannelProps = {
    canAddBookmarks: boolean;
    channelId: string;
    channelType: ChannelType;
    customStatus?: UserCustomStatus;
    isBookmarksEnabled: boolean;
    isCustomStatusEnabled: boolean;
    isCustomStatusExpired: boolean;
    hasBookmarks: boolean;
    componentId?: AvailableScreens;
    displayName: string;
    isOwnDirectMessage: boolean;
    memberCount?: number;
    searchTerm: string;
    teamId: string;
    callsEnabledInChannel: boolean;
    groupCallsAllowed: boolean;
    isTabletView?: boolean;
    shouldRenderBookmarks: boolean;
    shouldRenderChannelBanner: boolean;
};

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    customStatusContainer: {
        flexDirection: "row",
        height: 15,
        left: Platform.select({ ios: undefined, default: -2 }),
        marginTop: Platform.select({ ios: undefined, default: 1 }),
    },
    customStatusEmoji: {
        marginRight: 5,
        marginTop: Platform.select({ ios: undefined, default: -2 }),
    },
    customStatusText: {
        alignItems: "center",
        height: 15,
    },
    subtitle: {
        color: changeOpacity(theme.sidebarHeaderTextColor, 0.72),
        ...typography("Body", 75),
        lineHeight: 12,
        marginBottom: 8,
        marginTop: 2,
        height: 13,
    },
}));

const ChannelHeader = ({
    canAddBookmarks,
    channelId,
    channelType,
    componentId,
    customStatus,
    displayName,
    hasBookmarks,
    isBookmarksEnabled,
    isCustomStatusEnabled,
    isCustomStatusExpired,
    isOwnDirectMessage,
    memberCount,
    searchTerm,
    teamId,
    callsEnabledInChannel,
    groupCallsAllowed,
    isTabletView,
    shouldRenderBookmarks,
    shouldRenderChannelBanner,
}: ChannelProps) => {
    const intl = useIntl();
    const isTablet = useIsTablet();
    const theme = useTheme();
    const styles = getStyleSheet(theme);
    const defaultHeight = useDefaultHeaderHeight();
    const serverUrl = useServerUrl();
    const [isCallOptVisible, setisCallOptVisible] = useState(false);

    const callsConfig = getCallsConfig(serverUrl);

    // NOTE: callsEnabledInChannel will be true/false (not undefined) based on explicit state + the DefaultEnabled system setting
    //   which ultimately comes from channel/index.tsx, and observeIsCallsEnabledInChannel
    let callsAvailable = callsConfig.pluginEnabled && callsEnabledInChannel;
    if (!groupCallsAllowed && channelType !== General.DM_CHANNEL) {
        callsAvailable = false;
    }

    const isDMorGM = isTypeDMorGM(channelType);
    const contextStyle = useMemo(
        () => ({
            top: defaultHeight,
        }),
        [defaultHeight]
    );

    const leftComponent = useMemo(() => {
        if (isTablet || !channelId || !teamId) {
            return undefined;
        }

        return <OtherMentionsBadge channelId={channelId} />;
    }, [isTablet, channelId, teamId]);

    const onBackPress = useCallback(() => {
        Keyboard.dismiss();
        popTopScreen(componentId);
    }, [componentId]);

    const onTitlePress = useCallback(
        preventDoubleTap(() => {
            let title;
            switch (channelType) {
                case General.DM_CHANNEL:
                    title = intl.formatMessage({
                        id: "screens.channel_info.dm",
                        defaultMessage: "Direct message info",
                    });
                    break;
                case General.GM_CHANNEL:
                    title = intl.formatMessage({
                        id: "screens.channel_info.gm",
                        defaultMessage: "Group message info",
                    });
                    break;
                default:
                    title = intl.formatMessage({
                        id: "screens.channel_info",
                        defaultMessage: "Channel info",
                    });
                    break;
            }

            const closeButton = CompassIcon.getImageSourceSync(
                "close",
                24,
                theme.sidebarHeaderTextColor
            );
            const closeButtonId = "close-channel-info";

            const options = {
                topBar: {
                    leftButtons: [
                        {
                            id: closeButtonId,
                            icon: closeButton,
                            testID: "close.channel_info.button",
                        },
                    ],
                },
            };
            showModal(
                Screens.CHANNEL_INFO,
                title,
                { channelId, closeButtonId },
                options
            );
        }),
        [channelId, channelType, intl, theme]
    );

    const onChannelQuickAction = useCallback(() => {
        if (isTablet) {
            onTitlePress();
            return;
        }

        // When calls is enabled, we need space to move the "Copy Link" from a button to an option
        const items = callsAvailable && !isDMorGM ? 3 : 2;
        let height =
            CHANNEL_ACTIONS_OPTIONS_HEIGHT +
            SEPARATOR_HEIGHT +
            MARGIN +
            items * ITEM_HEIGHT;
        if (Platform.OS === "android") {
            height += BOTTOM_SHEET_ANDROID_OFFSET;
        }

        const renderContent = () => {
            return (
                <QuickActions
                    channelId={channelId}
                    callsEnabled={callsAvailable}
                    isDMorGM={isDMorGM}
                />
            );
        };

        bottomSheet({
            title: "",
            renderContent,
            snapPoints: [1, bottomSheetSnapPoint(1, height)],
            theme,
            closeButtonId: "close-channel-quick-actions",
        });
    }, [channelId, isDMorGM, isTablet, onTitlePress, theme, callsAvailable]);

    const rightButtons: HeaderRightButton[] = useMemo(
        () => [
            callsAvailable && {
                iconName: "phone",
                onPress: () => {
                    callsAvailable
                        ? setisCallOptVisible(true)
                        : Alert.alert(
                              "Calls are not available in this channel."
                          );
                },
                buttonType: "opacity",
                testID: "channel_header.phone.button",
            },
            {
                iconName: Platform.select({
                    android: "dots-vertical",
                    default: "dots-horizontal",
                }),
                onPress: onChannelQuickAction,
                buttonType: "opacity",
                testID: "channel_header.channel_quick_actions.button",
            },
        ],
        [isTablet, searchTerm, onChannelQuickAction]
    );

    let title = displayName;
    if (isOwnDirectMessage) {
        title = intl.formatMessage(
            {
                id: "channel_header.directchannel.you",
                defaultMessage: "{displayName} (you)",
            },
            { displayName }
        );
    }

    let subtitle;
    if (memberCount) {
        subtitle = intl.formatMessage(
            {
                id: "channel_header.member_count",
                defaultMessage:
                    "{count, plural, one {# member} other {# members}}",
            },
            { count: memberCount }
        );
    } else if (!customStatus || !customStatus.text || isCustomStatusExpired) {
        subtitle = intl.formatMessage({
            id: "channel_header.info",
            defaultMessage: "View info",
        });
    }

    const subtitleCompanion = useMemo(() => {
        if (
            memberCount ||
            !customStatus ||
            !customStatus.text ||
            isCustomStatusExpired
        ) {
            return (
                <CompassIcon
                    color={changeOpacity(theme.sidebarHeaderTextColor, 0.72)}
                    name="chevron-right"
                    size={14}
                />
            );
        } else if (customStatus && customStatus.text) {
            return (
                <View style={styles.customStatusContainer}>
                    {isCustomStatusEnabled && Boolean(customStatus.emoji) && (
                        <CustomStatusEmoji
                            customStatus={customStatus}
                            emojiSize={13}
                            style={styles.customStatusEmoji}
                        />
                    )}
                    <View style={styles.customStatusText}>
                        <Text
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            style={styles.subtitle}
                            testID="channel_header.custom_status.custom_status_text"
                        >
                            {customStatus.text}
                        </Text>
                    </View>
                </View>
            );
        }

        return undefined;
    }, [memberCount, customStatus, isCustomStatusExpired]);

    const showBookmarkBar =
        isBookmarksEnabled && hasBookmarks && shouldRenderBookmarks;

    const goToCallScreen = useCallback(async () => {
        const options: any = {
            layout: {
                backgroundColor: "#000",
                componentBackgroundColor: "#000",
            },
            topBar: {
                background: {
                    color: "#000",
                },
                visible: Platform.OS === "android",
            },
        };

        // const title = formatMessage({
        //     id: "mobile.calls_call_screen",
        //     defaultMessage: "Call",
        // });
        await dismissAllModalsAndPopToScreen(
            Screens.CALL,
            title,
            { fromThreadScreen: true },
            options
        );
    }, []);

    const onPhonePress = useCallback(() => {
        return (
            callsAvailable && (
                <ChannelInfoStartButton
                    serverUrl={serverUrl}
                    channelId={channelId}
                    dismissChannelInfo={() => {
                        setisCallOptVisible(false);
                        dismissBottomSheet();
                    }}
                />
            )
        );
    }, [callsAvailable, channelId, serverUrl]);

    const callModal = () => {
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={isCallOptVisible}
                statusBarTranslucent={true}
                onRequestClose={() => {
                    setisCallOptVisible(false);
                }}
            >
                <Pressable
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                    onPress={() => {
                        setisCallOptVisible(false);
                    }}
                >
                    <View
                        style={{
                            width: "80%",

                            minHeight: "20%",
                            backgroundColor: theme.centerChannelBg,
                            borderRadius: 10,
                            padding: 20,
                        }}
                    >
                        <Text
                            style={{
                                color: theme.centerChannelColor,
                                fontSize: 16,
                                marginBottom: 10,
                                textAlign: "center",
                                marginBottom: 10,
                            }}
                        >
                            Do you want to start a call with
                            <Text
                                style={{
                                    color: theme.centerChannelColor,
                                    fontSize: 16,
                                    fontWeight: "bold",
                                    marginBottom: 10,
                                    textTransform: "capitalize",
                                }}
                            >
                                {" "}
                                {displayName}
                            </Text>
                            ?
                        </Text>
                        {onPhonePress()}
                        <Pressable
                            onPress={() => {
                                setisCallOptVisible(false);
                            }}
                        >
                            <Text
                                style={{
                                    color: theme.errorTextColor,
                                    fontSize: 13,
                                    textAlign: "center",
                                    marginTop: 15,
                                }}
                            >
                                Cancel
                            </Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>
        );
    };
    return (
        <>
            <NavigationHeader
                isLargeTitle={false}
                leftComponent={leftComponent}
                onBackPress={onBackPress}
                onTitlePress={onTitlePress}
                rightButtons={rightButtons}
                showBackButton={!isTablet || !isTabletView}
                subtitle={subtitle}
                subtitleCompanion={subtitleCompanion}
                title={title}
            />
            <View style={contextStyle}>
                <RoundedHeaderContext />
            </View>
            {showBookmarkBar && (
                <ChannelHeaderBookmarks
                    canAddBookmarks={canAddBookmarks}
                    channelId={channelId}
                />
            )}
            {shouldRenderChannelBanner && (
                <ChannelBanner
                    channelId={channelId}
                    isTopItem={!showBookmarkBar}
                />
            )}
            {callModal()}
        </>
    );
};

export default ChannelHeader;
