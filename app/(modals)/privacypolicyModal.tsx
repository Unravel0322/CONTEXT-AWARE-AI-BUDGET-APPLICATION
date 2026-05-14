import BackButton from "@/components/BackButton";
import Header from "@/components/Header";
import ModalWrapper from "@/components/ModalWrapper";
import Typo from "@/components/Typo";
import { colors, spacingY } from "@/constants/theme";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

const PrivacyPolicyModal = () => {
  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header
          title="Privacy Policy"
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroSection}>
            <Typo size={24} fontWeight={"700"} color={colors.white}>
            Privacy Policy
            </Typo>
            <Typo color={colors.neutral300} size={15} style={styles.heroText}>
              This Privacy Policy explains how AI Context Aware Budgeting App collects, uses, and
              protects your personal information when you use the application.
            </Typo>
          </View>

          <View style={styles.section}>
            <Typo size={20} fontWeight={"700"} color={colors.white}>
              1. Information We Collect
            </Typo>
            <Typo color={colors.neutral300} size={15} style={styles.bodyText}>
              AI Context Aware Budgeting App may collect information such as your profile details,
              transaction records, expense descriptions, uploaded receipt
              images, and other data you provide while using the app.
            </Typo>
          </View>

          <View style={styles.section}>
            <Typo size={20} fontWeight={"700"} color={colors.white}>
              2. How We Use Your Information
            </Typo>
            <Typo color={colors.neutral300} size={15} style={styles.bodyText}>
              The information collected is used to manage your account, track
              your expenses and budgets, improve app functionality, provide
              analytics and insights, and enhance your overall user experience.
            </Typo>
          </View>

          <View style={styles.section}>
            <Typo size={20} fontWeight={"700"} color={colors.white}>
              3. Receipt Images and OCR Data
            </Typo>
            <Typo color={colors.neutral300} size={15} style={styles.bodyText}>
              If you upload receipt images, the app may process them to extract
              text and transaction details. This information is used only for
              helping you record expenses more efficiently.
            </Typo>
          </View>

          <View style={styles.section}>
            <Typo size={20} fontWeight={"700"} color={colors.white}>
              4. Data Storage
            </Typo>
            <Typo color={colors.neutral300} size={15} style={styles.bodyText}>
              Your information may be stored securely using connected backend
              services such as authentication and database services. Reasonable
              steps are taken to help protect user data from unauthorized
              access, loss, or misuse.
            </Typo>
          </View>

          <View style={styles.section}>
            <Typo size={20} fontWeight={"700"} color={colors.white}>
              5. Data Sharing
            </Typo>
            <Typo color={colors.neutral300} size={15} style={styles.bodyText}>
              AI Context Aware Budgeting App does not sell your personal information. Your data is
              only used for app-related purposes and may only be shared when
              required for technical functionality, legal obligations, or
              service operation.
            </Typo>
          </View>

          <View style={styles.section}>
            <Typo size={20} fontWeight={"700"} color={colors.white}>
              6. User Control
            </Typo>
            <Typo color={colors.neutral300} size={15} style={styles.bodyText}>
              Users may review, update, or delete certain personal information
              within the application, subject to available app features and
              account settings.
            </Typo>
          </View>

          <View style={styles.section}>
            <Typo size={20} fontWeight={"700"} color={colors.white}>
              7. Security
            </Typo>
            <Typo color={colors.neutral300} size={15} style={styles.bodyText}>
              We aim to implement appropriate security measures to protect user
              information. However, no digital system can guarantee complete
              security, and users should also take care in protecting their own
              accounts and devices.
            </Typo>
          </View>

          <View style={styles.section}>
            <Typo size={20} fontWeight={"700"} color={colors.white}>
              8. Changes to This Policy
            </Typo>
            <Typo color={colors.neutral300} size={15} style={styles.bodyText}>
              This Privacy Policy may be updated from time to time. Any changes
              will be reflected within the application, and continued use of the
              app may indicate acceptance of the updated policy.
            </Typo>
          </View>

          <View style={[styles.section, styles.lastSection]}>
            <Typo size={20} fontWeight={"700"} color={colors.white}>
              9. Contact
            </Typo>
            <Typo color={colors.neutral300} size={15} style={styles.bodyText}>
              If you have any questions about this Privacy Policy, you may
              contact the application support team or developer through the
              available support channels.
            </Typo>
          </View>
        </ScrollView>
      </View>
    </ModalWrapper>
  );
};

export default PrivacyPolicyModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacingY._20,
  },
  content: {
    paddingTop: spacingY._5,
    paddingBottom: spacingY._30,
    gap: spacingY._10,
  },
  heroSection: {
    gap: spacingY._10,
    marginTop: spacingY._5,
    paddingBottom: spacingY._10,
  },
  heroText: {
    lineHeight: 26,
  },
  section: {
    gap: spacingY._10,
    paddingBottom: spacingY._15,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral800,
  },
  lastSection: {
    borderBottomWidth: 0,
    paddingBottom: spacingY._30,
  },
  bodyText: {
    lineHeight: 28,
  },
});