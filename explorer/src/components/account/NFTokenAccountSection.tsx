import { NftokenTypes } from "@glow-xyz/nftoken-js";
import { PublicKey } from "@solana/web3.js";
import { Address } from "components/common/Address";
import { TableCardBody } from "components/common/TableCardBody";
import {
  Account,
  useAccountInfo,
  useFetchAccountInfo,
} from "providers/accounts";
import { useEffect, useState } from "react";
import {
  parseNFTokenCollectionAccount,
  parseNFTokenNFTAccount,
} from "../../providers/accounts/utils/isNFTokenAccount";
import { MAX_TIME_LOADING_IMAGE, useCachedImage } from "../common/NFTArt";
import { useCollectionNfts, useNftokenMetadata } from "./nftoken-hooks";
import { UnknownAccountCard } from "./UnknownAccountCard";

export function NFTokenAccountSection({ account }: { account: Account }) {
  const nft = parseNFTokenNFTAccount(account);
  if (nft) {
    return <NFTCard nft={nft} />;
  }

  const collection = parseNFTokenCollectionAccount(account);
  if (collection) {
    return <CollectionCard collection={collection} />;
  }

  return <UnknownAccountCard account={account} />;
}

const NFTCard = ({ nft }: { nft: NftokenTypes.Nft }) => {
  const fetchInfo = useFetchAccountInfo();
  const refresh = () => fetchInfo(new PublicKey(nft.address));

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-header-title mb-0 d-flex align-items-center">
          Overview
        </h3>
        <button className="btn btn-white btn-sm" onClick={refresh}>
          <span className="fe fe-refresh-cw me-2"></span>
          Refresh
        </button>
      </div>

      <TableCardBody>
        <tr>
          <td>Address</td>
          <td className="text-lg-end">
            <Address pubkey={new PublicKey(nft.address)} alignRight raw />
          </td>
        </tr>
        <tr>
          <td>Authority</td>
          <td className="text-lg-end">
            <Address pubkey={new PublicKey(nft.authority)} alignRight link />
          </td>
        </tr>
        <tr>
          <td>Holder</td>
          <td className="text-lg-end">
            <Address pubkey={new PublicKey(nft.holder)} alignRight link />
          </td>
        </tr>
        <tr>
          <td>Delegate</td>
          <td className="text-lg-end">
            {nft.delegate ? (
              <Address pubkey={new PublicKey(nft.delegate)} alignRight link />
            ) : (
              "Not Delegated"
            )}
          </td>
        </tr>
        <tr>
          <td>Collection</td>
          <td className="text-lg-end">
            {nft.collection ? (
              <div>
                <Address
                  pubkey={new PublicKey(nft.collection)}
                  alignRight
                  link
                />

                <CollectionInfo collection={nft.collection} imageSize={24} />
              </div>
            ) : (
              "No Collection"
            )}
          </td>
        </tr>
      </TableCardBody>
    </div>
  );
};

const CollectionInfo = ({
  collection,
  imageSize,
}: {
  collection: string;
  imageSize: number;
}) => {
  const collectionAccount = useAccountInfo(collection);
  const fetchInfo = useFetchAccountInfo();

  const collectionParsed = parseNFTokenCollectionAccount(
    collectionAccount?.data
  );
  const { data: metadata } = useNftokenMetadata(
    collectionParsed?.metadata_url ?? null
  );

  useEffect(() => {
    fetchInfo(new PublicKey(collection));
  }, [collection, fetchInfo]);

  return (
    <div
      className={"mt-2"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        justifyContent: "flex-end",
      }}
    >
      <NftokenImage size={imageSize} url={metadata?.image} />

      <div>{metadata?.name ?? "Loading..."}</div>
    </div>
  );
};

export const NftokenImage = ({
  url,
  size,
}: {
  url: string | undefined;
  size: number;
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showError, setShowError] = useState<boolean>(false);
  const [timeout, setTimeout] = useState<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    // Set the timeout if we don't have a valid uri
    if (!url && !timeout) {
      setTimeout(setInterval(() => setShowError(true), MAX_TIME_LOADING_IMAGE));
    }

    // We have a uri - clear the timeout
    if (url && timeout) {
      clearInterval(timeout);
    }

    return () => {
      if (timeout) {
        clearInterval(timeout);
      }
    };
  }, [url, setShowError, timeout, setTimeout]);

  const { cachedBlob } = useCachedImage(url || "");

  return (
    <>
      {showError ? (
        <div
          style={{ width: size, height: size, backgroundColor: "lightgrey" }}
        />
      ) : (
        <>
          {isLoading && (
            <div
              style={{
                width: size,
                height: size,
                backgroundColor: "lightgrey",
              }}
            />
          )}
          <div className={`${isLoading ? "d-none" : "d-block"}`}>
            <img
              className={`rounded mx-auto ${isLoading ? "d-none" : "d-block"}`}
              src={cachedBlob}
              alt={"nft"}
              style={{
                width: size,
                height: size,
              }}
              onLoad={() => {
                setIsLoading(false);
              }}
              onError={() => {
                setShowError(true);
              }}
            />
          </div>
        </>
      )}
    </>
  );
};

const CollectionCard = ({
  collection,
}: {
  collection: NftokenTypes.Collection;
}) => {
  const fetchInfo = useFetchAccountInfo();
  const refresh = () => fetchInfo(new PublicKey(collection.address));

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-header-title mb-0 d-flex align-items-center">
          Overview
        </h3>
        <button className="btn btn-white btn-sm" onClick={refresh}>
          <span className="fe fe-refresh-cw me-2"></span>
          Refresh
        </button>
      </div>

      <TableCardBody>
        <tr>
          <td>Address</td>
          <td className="text-lg-end">
            <Address
              pubkey={new PublicKey(collection.address)}
              alignRight
              raw
            />
          </td>
        </tr>
        <tr>
          <td>Authority</td>
          <td className="text-lg-end">
            <Address
              pubkey={new PublicKey(collection.authority)}
              alignRight
              link
            />
          </td>
        </tr>
        <tr>
          <td>Number NFTs</td>
          <td className="text-lg-end">
            <NumNfts collection={collection.address} />
          </td>
        </tr>
      </TableCardBody>
    </div>
  );
};

const NumNfts = ({ collection }: { collection: string }) => {
  const { data: nfts } = useCollectionNfts({ collectionAddress: collection });
  return <div>{nfts?.length ?? "Loading"}</div>;
};
