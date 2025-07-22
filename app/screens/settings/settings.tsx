// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { Platform, View } from "react-native";
import React, { useCallback, useEffect, useMemo } from "react";
import { changeOpacity, makeStyleSheetFromTheme } from "@utils/theme";
import { dismissModal, goToScreen, setButtons } from "@screens/navigation";
import { useServerDisplayName, useServerUrl } from "@context/server";

import type { AvailableScreens } from "@typings/screens/navigation";
import CompassIcon from "@components/compass_icon";
import ReportProblem from "./report_problem";
import { Screens } from "@constants";
import SettingContainer from "@components/settings/container";
import SettingItem from "@components/settings/item";
import { handleGotoLocation } from "@actions/remote/command";
import { preventDoubleTap } from "@utils/tap";
import useAndroidHardwareBackHandler from "@hooks/android_back_handler";
import { useIntl } from "react-intl";
import useNavButtonPressed from "@hooks/navigation_button_pressed";
import { useTheme } from "@context/theme";

const CLOSE_BUTTON_ID = "close-settings";

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        containerStyle: {
            paddingLeft: 8,
            marginTop: 12,
        },
        helpGroup: {
            width: "91%",
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.08),
            height: 1,
            alignSelf: "center",

            // marginTop: 20,
        },
    };
});

type SettingsProps = {
    componentId: AvailableScreens;
    helpLink: string;
    showHelp: boolean;
    siteName: string;
};

//todo: Profile the whole feature - https://mattermost.atlassian.net/browse/MM-39711

const Settings = ({
    componentId,
    helpLink,
    showHelp,
    siteName,
}: SettingsProps) => {
    const theme = useTheme();
    const intl = useIntl();
    const serverUrl = useServerUrl();
    const serverDisplayName = useServerDisplayName();

    const serverName = siteName || serverDisplayName;
    const styles = getStyleSheet(theme);

    const closeButton = useMemo(() => {
        return {
            id: CLOSE_BUTTON_ID,
            icon: CompassIcon.getImageSourceSync(
                "close",
                24,
                theme.centerChannelColor
            ),
            testID: "close.settings.button",
        };
    }, [theme.centerChannelColor]);

    const close = useCallback(() => {
        dismissModal({ componentId });
    }, [componentId]);

    useEffect(() => {
        setButtons(componentId, {
            leftButtons: [closeButton],
        });
    }, []);

    useAndroidHardwareBackHandler(componentId, close);
    useNavButtonPressed(CLOSE_BUTTON_ID, componentId, close, []);

    const goToNotifications = preventDoubleTap(() => {
        const screen = Screens.SETTINGS_NOTIFICATION;
        const title = intl.formatMessage({
            id: "settings.notifications",
            defaultMessage: "Notifications",
        });

        goToScreen(screen, title);
    });

    const goToDisplaySettings = preventDoubleTap(() => {
        const screen = Screens.SETTINGS_DISPLAY;
        const title = intl.formatMessage({
            id: "settings.display",
            defaultMessage: "Display",
        });

        goToScreen(screen, title);
    });

    const goToAbout = preventDoubleTap(() => {
        const screen = Screens.ABOUT;
        const title = intl.formatMessage(
            { id: "settings.about", defaultMessage: "About {appTitle}" },
            { appTitle: serverName }
        );

        goToScreen(screen, title);
    });

    const goToAdvancedSettings = preventDoubleTap(() => {
        const screen = Screens.SETTINGS_ADVANCED;
        const title = intl.formatMessage({
            id: "settings.advanced_settings",
            defaultMessage: "Advanced Settings",
        });

        goToScreen(screen, title);
    });

    const openHelp = preventDoubleTap(() => {
        if (helpLink) {
            handleGotoLocation(serverUrl, intl, helpLink);
        }
    });

    return (
        <SettingContainer testID="settings">
            <SettingItem
                onPress={goToNotifications}
                optionName="notification"
                testID="settings.notifications.option"
            />
            <SettingItem
                onPress={goToDisplaySettings}
                optionName="display"
                testID="settings.display.option"
            />
            <SettingItem
                onPress={goToAdvancedSettings}
                optionName="advanced_settings"
                testID="settings.advanced_settings.option"
            />
            <SettingItem
                icon="information-outline"
                label={intl.formatMessage(
                    {
                        id: "settings.about",
                        defaultMessage: "About {appTitle}",
                    },
                    { appTitle: serverName }
                )}
                onPress={goToAbout}
                optionName="about"
                testID="settings.about.option"
            />
        </SettingContainer>
    );
};

export default Settings;
